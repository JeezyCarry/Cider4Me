import { beforeEach, describe, expect, test } from "bun:test";
import {
	compileIgnoredPatterns,
	parseFormInputFromDocument,
} from "../src/lib/context/form-input-parser";

// jsdom reports no layout; stub visibility so fields count as "visible" unless
// explicitly hidden (display:none / hidden attribute).
function stubVisibility(): void {
	Object.defineProperty(window.HTMLElement.prototype, "offsetParent", {
		configurable: true,
		get(this: HTMLElement) {
			return this.style?.display === "none" || this.hidden ? null : {};
		},
	});
	window.HTMLElement.prototype.getClientRects = function (this: HTMLElement) {
		return (this.style?.display === "none" || this.hidden
			? []
			: [
					{ width: 1, height: 1, top: 0, left: 0, bottom: 1, right: 1 },
				]) as unknown as DOMRectList;
	} as unknown as typeof window.HTMLElement.prototype.getClientRects;
}

function resetBody(html: string): void {
	document.body.innerHTML = html;
}

describe("form-input-parser", () => {
	beforeEach(() => {
		stubVisibility();
		resetBody("");
	});

	test("captures filled text input with a for-label", () => {
		resetBody(
			`<form id="checkout"><label for="email">Email</label><input id="email" name="email" type="email" value="a@b.c" /></form>`,
		);
		const captured = parseFormInputFromDocument(document, []);
		expect(captured.fields).toHaveLength(1);
		const field = captured.fields[0];
		expect(field.label).toBe("Email");
		expect(field.type).toBe("email");
		expect(field.value).toBe("a@b.c");
		expect(field.fieldPath).toBe("checkout > Email");
		expect(field.formLabel).toBe("checkout");
		expect(captured.url).toBe("https://example.com/");
	});

	test("resolves labels via wrap, aria-label, aria-labelledby, placeholder, name, id", () => {
		resetBody(`
      <form>
        <label>Wrapped<input name="wrap" value="1" /></label>
        <input name="aria" aria-label="Aria label" value="2" />
        <input id="labelled" aria-labelledby="lbl" value="3" /><span id="lbl">LabelledBy</span>
        <input name="ph" placeholder="Placeholder text" value="4" />
        <input name="name-fallback" value="5" />
        <input id="id-fallback" value="6" />
      </form>
    `);
		const fields = parseFormInputFromDocument(document, []).fields;
		expect(fields.map((f) => f.label)).toEqual([
			"Wrapped",
			"Aria label",
			"LabelledBy",
			"Placeholder text",
			"name-fallback",
			"id-fallback",
		]);
	});

	test("uses the chosen option innerText for select (not the raw value)", () => {
		resetBody(`
      <form>
        <label for="plan">Plan</label>
        <select id="plan" name="plan">
          <option value="pro">Pro Plan</option>
          <option value="boss" selected>Boss Mode</option>
        </select>
      </form>
    `);
		const field = parseFormInputFromDocument(document, []).fields[0];
		expect(field.label).toBe("Plan");
		expect(field.type).toBe("select");
		expect(field.value).toBe("Boss Mode");
	});

	test("captures one entry per checked radio group and only checked checkboxes", () => {
		resetBody(`
      <form>
        <label for="ship-a">Ship A</label><input id="ship-a" type="radio" name="delivery" value="a" />
        <label for="ship-b">Ship B</label><input id="ship-b" type="radio" name="delivery" value="b" checked />
        <label for="opt-on">Opt on</label><input id="opt-on" type="checkbox" name="opt" checked />
        <label for="opt-off">Opt off</label><input id="opt-off" type="checkbox" name="opt2" />
      </form>
    `);
		const fields = parseFormInputFromDocument(document, []).fields;
		expect(fields).toHaveLength(2);
		const radio = fields.find((f) => f.type === "radio");
		expect(radio?.label).toBe("Ship B");
		expect(radio?.value).toBe("Ship B");
		const checkbox = fields.find((f) => f.type === "checkbox");
		expect(checkbox?.label).toBe("Opt on");
		expect(checkbox?.value).toBe("checked");
	});

	test("excludes password, hidden, submit and sensitive autocomplete fields", () => {
		resetBody(`
      <form>
        <input name="user" value="me" />
        <input type="password" name="pass" value="secret" />
        <input type="hidden" name="h" value="h" />
        <input type="submit" value="Go" />
        <input name="cc" autocomplete="cc-number" value="4111" />
        <input name="code" autocomplete="one-time-code" value="123456" />
      </form>
    `);
		const fields = parseFormInputFromDocument(document, []).fields;
		expect(fields).toHaveLength(1);
		expect(fields[0].name).toBe("user");
	});

	test("excludes fields whose name matches a sensitive pattern (cvv, otp, iban)", () => {
		resetBody(`
      <form>
        <input name="cvv" value="123" />
        <input name="otp" value="456" />
        <input name="iban" value="NL91" />
        <input name="ok" value="fine" />
      </form>
    `);
		const fields = parseFormInputFromDocument(document, []).fields;
		expect(fields).toHaveLength(1);
		expect(fields[0].name).toBe("ok");
	});

	test("excludes password-like fields even without type=password (name/autocomplete)", () => {
		resetBody(`
      <form>
        <input name="password" type="text" value="hunter2" />
        <input name="pwd" type="text" value="secret" />
        <input name="passwd" type="text" value="secret" />
        <input name="email" autocomplete="current-password" type="text" value="secret" />
        <input name="token" autocomplete="new-password" type="text" value="other" />
        <input name="safe" type="text" value="fine" />
      </form>
    `);
		const fields = parseFormInputFromDocument(document, []).fields;
		expect(fields).toHaveLength(1);
		expect(fields[0].name).toBe("safe");
	});

	test("allows common non-sensitive names containing pin or password substrings (P2 guard)", () => {
		resetBody(`
      <form>
        <input name="shippingAddress" value="1" />
        <input name="shoppingCart" value="2" />
        <input name="opinion" value="3" />
        <input name="mapping" value="4" />
        <input name="helping" value="5" />
        <input name="spinning" value="6" />
        <input name="keepInTouch" value="7" />
      </form>
    `);
		const fields = parseFormInputFromDocument(document, []).fields;
		expect(fields).toHaveLength(7);
	});

	test("still excludes pin/pincode variants and password fields (P2 sensitive guard)", () => {
		resetBody(`
      <form>
        <input name="pin" value="1" />
        <input name="pincode" value="2" />
        <input name="pin-number" value="3" />
        <input name="pin_number" value="4" />
        <input name="password" value="5" />
        <input autocomplete="current-password" value="7" />
        <input autocomplete="new-password" value="8" />
      </form>
    `);
		const fields = parseFormInputFromDocument(document, []).fields;
		expect(fields).toHaveLength(0);
	});

	test("skips disabled, readOnly, display:none and empty fields", () => {
		resetBody(`
      <form>
        <input name="disabled" value="x" disabled />
        <input name="readonly" value="y" readonly />
        <input name="hidden-css" value="z" style="display:none" />
        <input name="empty" value="   " />
        <input name="filled" value="yes" />
      </form>
    `);
		const fields = parseFormInputFromDocument(document, []).fields;
		expect(fields).toHaveLength(1);
		expect(fields[0].name).toBe("filled");
	});

	test("compileIgnoredPatterns matches name/id/label case-insensitively and skips invalid regex", () => {
		const patterns = compileIgnoredPatterns(["[", "SEARCH", "foo"]);
		expect(patterns).toHaveLength(2);

		resetBody(`
      <form>
        <input name="SEARCH" value="1" />
        <input name="other" value="2" />
      </form>
    `);
		const fields = parseFormInputFromDocument(document, patterns).fields;
		expect(fields).toHaveLength(1);
		expect(fields[0].name).toBe("other");
	});

	test("matches user ignored patterns on the resolved label", () => {
		const patterns = compileIgnoredPatterns(["search"]);
		resetBody(`
      <form>
        <label for="x">Search box</label><input id="x" name="x" value="v" />
        <input name="q" value="hello" />
      </form>
    `);
		const fields = parseFormInputFromDocument(document, patterns).fields;
		expect(fields).toHaveLength(1);
		expect(fields[0].name).toBe("q");
	});

	test("uses form name/id/aria-label or form #n and (page) for free fields", () => {
		resetBody(`
      <form name="billing"><input name="a" value="1" /></form>
      <form><input name="b" value="2" /></form>
      <form aria-label="Login"><input name="c" value="3" /></form>
      <input name="d" value="4" />
    `);
		const fields = parseFormInputFromDocument(document, []).fields;
		expect(fields.map((f) => [f.formLabel, f.fieldPath])).toEqual([
			["billing", "billing > a"],
			["form #2", "form #2 > b"],
			["Login", "Login > c"],
			["(page)", "(page) > d"],
		]);
	});

	test("truncates long values to 1000 chars", () => {
		resetBody(
			`<form><label for="l">Big</label><textarea id="l" name="big">${"x".repeat(1500)}</textarea></form>`,
		);
		const field = parseFormInputFromDocument(document, []).fields[0];
		expect(field.value.length).toBe(1000);
		expect(field.value.endsWith("…")).toBe(true);
	});
});
