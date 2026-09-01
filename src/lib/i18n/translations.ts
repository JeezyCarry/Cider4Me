import type { AppLocale, ComposerSubmitMode } from "../shared/types";

export interface TranslationDictionary {
	common: {
		cancel: string;
		save: string;
		saving: string;
		add: string;
		clear: string;
		remove: string;
		back: string;
		loading: string;
		copied: string;
		copyCode: string;
		model: string;
	};
	content: {
		customPrompt: {
			closeAria: string;
			title: string;
			placeholder: string;
			submit: string;
		};
		launcher: {
			openSettingsAria: string;
			hideOptionsAria: string;
			closeSidebarAria: string;
			openSidebarAria: string;
			hideMenuAria: string;
			hideForever: string;
			hideForNow: string;
			openSettings: string;
		};
		resizeHandleAria: string;
		sidebarShellAria: string;
		selectionToolbar: {
			toolbarAria: string;
			inputAria: string;
			askAi: string;
			explain: string;
			translate: string;
			context: string;
			closeAria: string;
			copyTitle: string;
			openUrlTitle: string;
			openInSidebar: string;
			selectionContext: string;
			searchWith: (label: string) => string;
		};
	};
	sidebar: {
		title: string;
		headerEyebrow: string;
		closeAria: string;
		chatList: {
			emptyAria: string;
			emptyTitle: string;
			emptyBody: string;
			loadingAria: string;
			assistantRole: string;
			userRole: string;
			pageContextRole: string;
			formInputRole: string;
			edit: string;
			editAria: string;
			searching: string;
			sources: string;
			openSentContext: string;
		};
		contextPanel: {
			title: string;
			pageTitle: (title: string) => string;
			empty: string;
			on: string;
			off: string;
			tooltipOn: string;
			tooltipOff: string;
			statusIdle: string;
			statusRefreshing: string;
			statusError: string;
			statusFresh: string;
			statusFreshAt: (value: string) => string;
			statusStale: (reason: string) => string;
			capturedAt: (value: string) => string;
		};
		history: {
			screenAria: string;
			title: string;
			empty: string;
			backToChatAria: string;
			backLabel: string;
			conversationTitleAria: string;
			rename: string;
			renameAria: (title: string) => string;
		};
		composer: {
			placeholder: string;
			generating: string;
			cancel: string;
			send: string;
			keyboardHint: (mode: ComposerSubmitMode) => string;
			imagePreviewAlt: string;
			removeImageAria: string;
			imageReady: string;
			modelImageUnsupported: string;
			cancelEdit: string;
			editingNotice: (backupTitle: string) => string;
		};
		toolbar: {
			aria: string;
			newChat: string;
			newChatAria: string;
			history: string;
			historyAria: string;
			latchToBottom: string;
			latchToBottomAria: string;
			exportChat: string;
			exportChatAria: string;
		};
		nextMessageContext: {
			sectionAria: string;
			infoAria: string;
			tooltip: string;
			clearAria: string;
			liveSelection: string;
			pinned: string;
			removeItemAria: (label: string) => string;
			expandAria: string;
		};
		takeInput: {
			promptTitle: string;
			no: string;
			take: string;
			cancelHint: string;
		};
		defaults: {
			newConversationTitle: string;
		};
	};
	options: {
		pageTitle: string;
		eyebrow: string;
		heroBody: string;
		saveSettings: string;
		loadingSettings: string;
		overviewAria: string;
		overview: {
			models: { label: string; body: string };
			blockedSites: { label: string; body: string };
			searchProviders: { label: string; body: string };
		};
		sections: {
			language: {
				title: string;
				body: string;
				label: string;
				english: string;
				dutch: string;
			};
			providers: {
				title: string;
				body: string;
				addProvider: string;
				addProviderAria: string;
				addProviderTitle: string;
				providerType: string;
				label: string;
				baseUrl: string;
				apiKey: string;
				enabled: string;
				removeProvider: string;
				removeProviderAria: (label: string) => string;
				empty: string;
				typeOpenaiCompatible: string;
				typeOpenrouter: string;
				typeGoogleGemini: string;
				models: string;
				modelsBody: string;
				addModel: string;
				emptyModels: string;
				modelId: string;
				modelLabel: string;
				modelEnabled: string;
				supportsImages: string;
				webSearch: string;
				thinkingLevel: string;
				thinkingLevelDefault: string;
				edit: string;
				defaultLabel: string;
				disabledLabel: string;
				webSearchBadge: string;
				makeDefault: string;
				setDefaultAria: (label: string) => string;
				removeModelAria: (label: string) => string;
				toggleImagesAria: (label: string, enabled: boolean) => string;
				toggleWebSearchAria: (label: string, enabled: boolean) => string;
			};
			siteBlocklist: {
				title: string;
				body: string;
				addAria: string;
				empty: string;
				removeAria: string;
			};
			behavior: {
				title: string;
				body: string;
				autoReadTitle: string;
				autoReadBody: string;
				autoSendQuickActionsTitle: string;
				autoSendQuickActionsBody: string;
				selectionPopupFocusTitle: string;
				selectionPopupFocusBody: string;
				wrapTitle: string;
				wrapBody: string;
				debugTitle: string;
				debugBody: string;
				submitShortcut: string;
				submitShiftEnter: string;
				submitEnter: string;
				popupTarget: string;
				popupTargetCurrent: string;
				popupTargetNew: string;
				themeTitle: string;
				themeBody: string;
				themeLight: string;
				themeDark: string;
				themeSystem: string;
			};
			advanced: {
				title: string;
				takeInput: {
					title: string;
					description: string;
				};
				ignoredFields: {
					title: string;
					tooltip: string;
				};
			};
			promptTemplates: {
				title: string;
				body: string;
				ask: string;
				explain: string;
				translate: string;
				helper: string;
			};
			systemPrompt: {
				title: string;
				body: string;
				label: string;
				placeholder: string;
			};
			searchProviders: {
				title: string;
				body: string;
				addAria: string;
				addLabel: string;
				enableAria: (label: string) => string;
				providerNamePlaceholder: string;
				removeAria: string;
			};
			modes: {
				title: string;
				body: string;
				addMode: string;
				empty: string;
				label: string;
				removeModeAria: string;
				setActiveAria: (label: string) => string;
				activeLabel: string;
			};
			mcp: {
				title: string;
				body: string;
				bridgeTitle: string;
				bridgeBody: string;
				bridgeUrl: string;
				customServersTitle: string;
				addServer: string;
				serverName: string;
				serverUrl: string;
				transport: string;
				connected: string;
				disconnected: string;
				testConnection: string;
				empty: string;
			};
			debug: {
				title: string;
				body: string;
				export: string;
			};
		};
		debugFooter: {
			title: string;
			body: string;
		};
		saveFeedback: {
			success: string;
			failure: string;
		};
	};
	actions: {
		savedSelection: string;
		selectionContext: string;
		pinnedSnippet: string;
	};
	errors: {
		missingApiKey: string;
		missingApiBaseUrl: string;
		openRouterApiKeyRejected: string;
		apiAuthenticationFailed: string;
		chatCompletionFailed: string;
		missingGoogleGeminiApiKey: string;
		unknownChatError: string;
		invalidSearchProvider: string;
		invalidModelId: string;
	};
}

const en: TranslationDictionary = {
	common: {
		cancel: "Cancel",
		save: "Save",
		saving: "Saving…",
		add: "Add",
		clear: "Clear",
		remove: "Remove",
		back: "Back",
		loading: "Loading…",
		copied: "Copied",
		copyCode: "Copy code",
		model: "Model",
	},
	content: {
		customPrompt: {
			closeAria: "Close custom prompt dialog",
			title: "Custom prompt",
			placeholder: "Write a custom prompt for the current selection...",
			submit: "Use in sidebar",
		},
		launcher: {
			openSettingsAria: "Open settings menu",
			hideOptionsAria: "Hide AI button options",
			closeSidebarAria: "Close sidebar",
			openSidebarAria: "Open sidebar",
			hideMenuAria: "Hide AI button menu",
			hideForever: "Hide forever",
			hideForNow: "Hide for now",
			openSettings: "Open settings",
		},
		resizeHandleAria: "Resize sidebar",
		sidebarShellAria: "Cider4Me sidebar",
		selectionToolbar: {
			toolbarAria: "Selection actions",
			inputAria: "Selected text prompt",
			askAi: "Ask AI",
			explain: "Explain",
			translate: "Translate",
			context: "Context",
			closeAria: "Close selection popup",
			copyTitle: "Copy to clipboard",
			openUrlTitle: "Open as URL if valid",
			openInSidebar: "Open in sidebar",
			selectionContext: "Selection",
			searchWith: (label: string) => `Search with ${label}`,
		},
	},
	sidebar: {
		title: "AI sidebar",
		headerEyebrow: "Cider4Me",
		closeAria: "Close sidebar",
		chatList: {
			emptyAria: "No messages yet",
			emptyTitle: "Start a new conversation",
			emptyBody:
				"Use the page context above or select text on the page to ask a more focused question faster.",
			loadingAria: "Assistant is responding",
			assistantRole: "assistant",
			userRole: "user",
			pageContextRole: "page context",
			formInputRole: "form input",
			edit: "Edit",
			editAria: "Edit message",
			searching: "Searching the web",
			sources: "Sources",
			openSentContext: "Open full context",
		},
		contextPanel: {
			title: "Context",
			pageTitle: (title: string) => `Page: ${title}`,
			empty: "No page context loaded yet.",
			on: "Context on",
			off: "Context off",
			tooltipOn:
				"Page context is enabled. It refreshes when needed and is only sent again when the page content changed.",
			tooltipOff: "Page context is disabled. The page is not read or sent.",
			statusIdle: "Waiting for page context",
			statusRefreshing: "Refreshing page context",
			statusError: "Refreshing page context failed",
			statusFresh: "Page context is up to date",
			statusFreshAt: (value: string) => `Context updated at ${value}`,
			statusStale: (reason: string) => `Page context is stale (${reason})`,
			capturedAt: (value: string) => `updated at ${value}`,
		},
		history: {
			screenAria: "Conversation history",
			title: "History",
			empty: "No saved conversations yet.",
			backToChatAria: "Back to chat",
			backLabel: "Back",
			conversationTitleAria: "Conversation title",
			rename: "Rename",
			renameAria: (title: string) => `Rename ${title}`,
		},
		composer: {
			placeholder: "Type your message here or paste a photo/screenshot",
			generating: "Generating…",
			cancel: "Cancel",
			send: "Send",
			keyboardHint: (mode) =>
				mode === "enter"
					? "Enter sends · Shift+Enter adds a newline"
					: "Shift+Enter sends · Enter adds a newline",
			imagePreviewAlt: "Pending pasted image preview",
			removeImageAria: "Remove pasted image",
			imageReady: "Image ready to send with your next message.",
			modelImageUnsupported:
				"The selected model does not support images. Choose an image-compatible model or remove the image.",
			cancelEdit: "Cancel edit",
			editingNotice: (backupTitle: string) =>
				`Editing an earlier message. The previous version was saved to history as ${backupTitle}.`,
		},
		toolbar: {
			aria: "Chat toolbar",
			newChat: "New chat",
			newChatAria: "Start new chat",
			history: "History",
			historyAria: "Open chat history",
			latchToBottom: "Latch to bottom",
			latchToBottomAria: "Toggle auto-scroll to bottom",
			exportChat: "Export chat",
			exportChatAria: "Export full chat payload (debug)",
		},
		nextMessageContext: {
			sectionAria: "Next message context",
			infoAria: "About next message context",
			tooltip:
				"Only sent with your next message. Page context stays separate above.",
			clearAria: "Clear next message context",
			liveSelection: "Live selection",
			pinned: "Pinned",
			removeItemAria: (label: string) => `Remove ${label}`,
			expandAria: "Show full selection text",
		},
		takeInput: {
			promptTitle: "Include webpage form input?",
			no: "No (Enter)",
			take: "Take input (Tab+Enter)",
			cancelHint: "Esc to cancel",
		},
		defaults: {
			newConversationTitle: "New conversation",
		},
	},
	options: {
		pageTitle: "Cider4Me settings",
		eyebrow: "Foundation + settings",
		heroBody:
			"Manage your API key, default model, site blocklist, search providers, language, and debug mode.",
		saveSettings: "Save settings",
		loadingSettings: "Loading settings…",
		overviewAria: "Settings overview",
		overview: {
			models: { label: "Models", body: "Available models in your selector." },
			blockedSites: {
				label: "Blocked sites",
				body: "Sites where the launcher stays hidden.",
			},
			searchProviders: {
				label: "Search providers",
				body: "Search actions from the selection toolbar.",
			},
		},
		sections: {
			language: {
				title: "Language",
				body: "Choose the display language for the extension UI.",
				label: "Display language",
				english: "English",
				dutch: "Dutch",
			},
			providers: {
				title: "Providers & models",
				body:
					"Add one or more providers, attach a model or models to each, and pick a default. The same model may be added to multiple providers.",
				addProvider: "Add provider",
				addProviderAria: "Add a provider",
				addProviderTitle: "Add a provider",
				providerType: "Provider type",
				label: "Name",
				baseUrl: "API base URL",
				apiKey: "API key",
				enabled: "Enabled",
				removeProvider: "Remove provider",
				removeProviderAria: (label: string) => `Remove ${label || "provider"}`,
				empty: "No providers configured yet. Add one to get started.",
				typeOpenaiCompatible: "OpenAI-compatible",
				typeOpenrouter: "OpenRouter",
				typeGoogleGemini: "Google / Gemini",
				models: "Models",
				modelsBody:
					"Add each model ID this provider exposes. Image and web-search toggles depend on what the endpoint supports.",
				addModel: "Add model",
				emptyModels: "No models configured yet.",
				modelId: "Model ID",
				modelLabel: "Display label",
				modelEnabled: "Enabled in selector",
				supportsImages: "Supports images",
				webSearch: "Enable web search",
				thinkingLevel: "Thinking level",
				thinkingLevelDefault: "Provider default",
				edit: "Edit",
				defaultLabel: "Default",
				disabledLabel: "Hidden",
				webSearchBadge: "Web search",
				makeDefault: "Set as default",
				setDefaultAria: (label: string) => `Set ${label || "model"} as default`,
				removeModelAria: (label: string) => `Remove ${label || "model"}`,
				toggleImagesAria: (label: string, enabled: boolean) =>
					`${enabled ? "Disable" : "Enable"} images for ${label || "model"}`,
				toggleWebSearchAria: (label: string, enabled: boolean) =>
					`${enabled ? "Disable" : "Enable"} web search for ${label || "model"}`,
			},
			siteBlocklist: {
				title: "Site blocklist",
				body:
					"Domains in this list hide the AI button on those sites. `Hide forever` adds the current site here.",
				addAria: "Add blocked site",
				empty: "No blocked sites yet.",
				removeAria: "Remove blocked site",
			},
			behavior: {
				title: "Behavior",
				body:
					"Choose how the sidebar behaves while reading, typing, and debugging.",
				autoReadTitle: "Automatically read page context",
				autoReadBody: "Load context as soon as the sidebar opens.",
				autoSendQuickActionsTitle: "Auto-send quick actions",
				autoSendQuickActionsBody:
					"Automatically send the prompt when using Explain or Translate from the selection popup.",
				selectionPopupFocusTitle: "Selection popup captures keyboard focus",
				selectionPopupFocusBody:
					"When off, the page keeps receiving keystrokes until you click the popup.",
				wrapTitle: "Wrap assistant text",
				wrapBody: "Make long responses easier to read.",
				debugTitle: "Enable debug logging",
				debugBody: "Store extra logs for troubleshooting.",
				submitShortcut: "Composer submit shortcut",
				submitShiftEnter: "Shift+Enter sends, Enter adds newline",
				submitEnter: "Enter sends, Shift+Enter adds newline",
				popupTarget: "Selection popup Ask AI target",
				popupTargetCurrent: "Continue current chat",
				popupTargetNew: "Start new chat",
				themeTitle: "Theme",
				themeBody: "Choose between light, dark, or system theme.",
				themeLight: "Light",
				themeDark: "Dark",
				themeSystem: "System",
			},
			advanced: {
				title: "Advanced",
				takeInput: {
					title: "Take input mode",
					description:
						"When enabled, sending a message asks whether to include filled-in form fields from the page.",
				},
				ignoredFields: {
					title: "Ignored input fields (one pattern per line)",
					tooltip:
						"Fields whose name, id or label match one of these patterns are never captured. Password, credit card and one-time-code fields are always excluded.",
				},
			},
			promptTemplates: {
				title: "Prompt templates",
				body: "Customize the default prompts for the selection actions.",
				ask: "Ask AI template",
				explain: "Explain template",
				translate: "Translate template",
				helper: "Use {{selection}} where the selected text should be inserted.",
			},
			systemPrompt: {
				title: "System prompt",
				body: "Provide global instructions that the AI should always follow.",
				label: "Global system prompt",
				placeholder: "You are a helpful assistant...",
			},
			searchProviders: {
				title: "Search providers",
				body:
					"Edit providers inline. Show the provider name and URL template directly in the list.",
				addAria: "Add search provider",
				addLabel: "Add provider",
				enableAria: (label: string) => `Enable ${label || "search provider"}`,
				providerNamePlaceholder: "Provider name",
				removeAria: "Remove search provider",
			},
			modes: {
				title: "Agent Modes",
				body:
					"Manage persona instructions appended to the global system prompt. The checked mode is used in chat.",
				addMode: "Add mode",
				empty: "No agent modes configured yet.",
				label: "Name",
				removeModeAria: "Remove agent mode",
				setActiveAria: (label: string) => `Use ${label || "mode"} in chat`,
				activeLabel: "Active",
			},
			mcp: {
				title: "MCP Integration",
				body:
					"Connect to external Model Context Protocol servers or the local Cider4Me bridge.",
				bridgeTitle: "Local Cider4Me Bridge",
				bridgeBody: "Pushes browser page context and chat history to your IDE.",
				bridgeUrl: "Bridge WebSocket URL",
				customServersTitle: "Custom MCP Servers (Extension-inward)",
				addServer: "Add server",
				serverName: "Name",
				serverUrl: "URL",
				transport: "Transport",
				connected: "Connected",
				disconnected: "Disconnected",
				testConnection: "Test connection",
				empty: "No custom MCP servers configured yet.",
			},
			debug: {
				title: "Debug",
				body: "Export local debug logs when debug mode is enabled.",
				export: "Export logs",
			},
		},
		debugFooter: {
			title: "Debug mode",
			body: "Show detailed console logs for troubleshooting.",
		},
		saveFeedback: {
			success: "Settings saved successfully.",
			failure: "Failed to save settings:",
		},
	},
	actions: {
		savedSelection: "Saved selection",
		selectionContext: "Selection context",
		pinnedSnippet: "Pinned snippet",
	},
	errors: {
		missingApiKey: "OpenAI-compatible API key is not configured",
		missingApiBaseUrl: "OpenAI-compatible API base URL is not configured",
		openRouterApiKeyRejected:
			"OpenRouter rejected the API key (401). Create a new key at openrouter.ai/keys (sk-or-v1-…), not a management key. Wait for Saved, then retry.",
		apiAuthenticationFailed: "Authentication failed",
		chatCompletionFailed: "Chat completion request failed",
		missingGoogleGeminiApiKey: "Google Gemini API key is not configured",
		unknownChatError: "Unknown chat error",
		invalidSearchProvider: "Every search provider needs both a name and a URL.",
		invalidModelId: "A model ID is required.",
	},
};

const nl: TranslationDictionary = {
	common: {
		cancel: "Annuleren",
		save: "Opslaan",
		saving: "Opslaan…",
		add: "Toevoegen",
		clear: "Wissen",
		remove: "Verwijderen",
		back: "Terug",
		loading: "Laden…",
		copied: "Gekopieerd",
		copyCode: "Code kopiëren",
		model: "Model",
	},
	content: {
		customPrompt: {
			closeAria: "Sluit aangepast promptvenster",
			title: "Aangepaste prompt",
			placeholder: "Schrijf een aangepaste prompt voor de huidige selectie...",
			submit: "Gebruik in sidebar",
		},
		launcher: {
			openSettingsAria: "Open instellingenmenu",
			hideOptionsAria: "Verberg AI-knopopties",
			closeSidebarAria: "Sluit sidebar",
			openSidebarAria: "Open sidebar",
			hideMenuAria: "Verberg AI-knoppenmenu",
			hideForever: "Voor altijd verbergen",
			hideForNow: "Nu verbergen",
			openSettings: "Open instellingen",
		},
		resizeHandleAria: "Pas sidebarbreedte aan",
		sidebarShellAria: "Cider4Me-sidebar",
		selectionToolbar: {
			toolbarAria: "Selectie-acties",
			inputAria: "Prompt voor geselecteerde tekst",
			askAi: "Vraag AI",
			explain: "Uitleggen",
			translate: "Vertalen",
			context: "Context",
			closeAria: "Sluit selectievenster",
			copyTitle: "Kopieer naar klembord",
			openUrlTitle: "Open als URL indien geldig",
			openInSidebar: "Open in zijbalk",
			selectionContext: "Selectie",
			searchWith: (label: string) => `Zoek met ${label}`,
		},
	},
	sidebar: {
		title: "AI-sidebar",
		headerEyebrow: "Cider4Me",
		closeAria: "Sluit sidebar",
		chatList: {
			emptyAria: "Nog geen berichten",
			emptyTitle: "Begin een nieuw gesprek",
			emptyBody:
				"Gebruik de pagina-context hierboven of selecteer tekst op de pagina om sneller een gerichte vraag te stellen.",
			loadingAria: "Assistent reageert",
			assistantRole: "assistent",
			userRole: "gebruiker",
			pageContextRole: "pagina-context",
			formInputRole: "formulierinvoer",
			edit: "Bewerk",
			editAria: "Bewerk bericht",
			searching: "Web doorzoeken",
			sources: "Bronnen",
			openSentContext: "Open volledige context",
		},
		contextPanel: {
			title: "Context",
			pageTitle: (title: string) => `Pagina: ${title}`,
			empty: "Nog geen pagina-context geladen.",
			on: "Context aan",
			off: "Context uit",
			tooltipOn:
				"Pagina-context staat aan. Die wordt alleen ververst en opnieuw meegestuurd als dat nodig is.",
			tooltipOff:
				"Pagina-context staat uit. De pagina wordt niet gelezen of meegestuurd.",
			statusIdle: "Wacht op pagina-context",
			statusRefreshing: "Pagina-context wordt ververst",
			statusError: "Verversen van pagina-context mislukt",
			statusFresh: "Pagina-context is actueel",
			statusFreshAt: (value: string) => `Context bijgewerkt op ${value}`,
			statusStale: (reason: string) => `Pagina-context is verouderd (${reason})`,
			capturedAt: (value: string) => `updated at ${value}`,
		},
		history: {
			screenAria: "Gespreksgeschiedenis",
			title: "Geschiedenis",
			empty: "Nog geen gesprekken opgeslagen.",
			backToChatAria: "Terug naar chat",
			backLabel: "Terug",
			conversationTitleAria: "Gesprekstitel",
			rename: "Hernoemen",
			renameAria: (title: string) => `Hernoem ${title}`,
		},
		composer: {
			placeholder: "Voer hier je bericht in of plak een foto/screenshot",
			generating: "Genereren…",
			cancel: "Annuleren",
			send: "Versturen",
			keyboardHint: (mode) =>
				mode === "enter"
					? "Enter verstuurt · Shift+Enter voegt een nieuwe regel toe"
					: "Shift+Enter verstuurt · Enter voegt een nieuwe regel toe",
			imagePreviewAlt: "Preview van geplakte afbeelding",
			removeImageAria: "Verwijder geplakte afbeelding",
			imageReady:
				"Afbeelding staat klaar om met je volgende bericht mee te sturen.",
			modelImageUnsupported:
				"Het geselecteerde model ondersteunt geen afbeeldingen. Kies een image-compatibel model of verwijder de afbeelding.",
			cancelEdit: "Bewerken annuleren",
			editingNotice: (backupTitle: string) =>
				`Je bewerkt een eerder bericht. De vorige versie staat nu in de geschiedenis als ${backupTitle}.`,
		},
		toolbar: {
			aria: "Chatwerkbalk",
			newChat: "Nieuwe chat",
			newChatAria: "Start nieuwe chat",
			history: "Geschiedenis",
			historyAria: "Open chatgeschiedenis",
			latchToBottom: "Vastzetten aan onderkant",
			latchToBottomAria: "Automatisch naar beneden scrollen aan/uit",
			exportChat: "Chat exporteren",
			exportChatAria: "Volledige chat-payload exporteren (debug)",
		},
		nextMessageContext: {
			sectionAria: "Context voor volgend bericht",
			infoAria: "Over context voor volgend bericht",
			tooltip:
				"Wordt alleen meegestuurd met je volgende bericht. Pagina-context blijft hierboven apart.",
			clearAria: "Wis context voor volgend bericht",
			liveSelection: "Live selectie",
			pinned: "Vastgepind",
			removeItemAria: (label: string) => `Verwijder ${label}`,
			expandAria: "Toon volledige selectietekst",
		},
		takeInput: {
			promptTitle: "Formulierinvoer van de pagina meesturen?",
			no: "Nee (Enter)",
			take: "Take input (Tab+Enter)",
			cancelHint: "Esc om te annuleren",
		},
		defaults: {
			newConversationTitle: "Nieuw gesprek",
		},
	},
	options: {
		pageTitle: "Cider4Me-instellingen",
		eyebrow: "Basis + instellingen",
		heroBody:
			"Beheer je API-key, standaardmodel, site-blocklist, zoekproviders, taal en debugmodus.",
		saveSettings: "Instellingen opslaan",
		loadingSettings: "Instellingen laden…",
		overviewAria: "Instellingenoverzicht",
		overview: {
			models: {
				label: "Modellen",
				body: "Beschikbare modellen in je keuzelijst.",
			},
			blockedSites: {
				label: "Geblokkeerde sites",
				body: "Sites waar de launcher verborgen blijft.",
			},
			searchProviders: {
				label: "Zoekproviders",
				body: "Zoekacties vanuit de selectie-toolbar.",
			},
		},
		sections: {
			language: {
				title: "Taal",
				body: "Kies de weergavetaal voor de extensie-interface.",
				label: "Weergavetaal",
				english: "Engels",
				dutch: "Nederlands",
			},
			providers: {
				title: "Providers & modellen",
				body:
					"Voeg een of meer providers toe, koppel een of meer modellen aan elke provider en kies een standaardmodel. Hetzelfde model mag bij meerdere providers staan.",
				addProvider: "Provider toevoegen",
				addProviderAria: "Voeg een provider toe",
				addProviderTitle: "Provider toevoegen",
				providerType: "Providertype",
				label: "Naam",
				baseUrl: "API-basis-URL",
				apiKey: "API-key",
				enabled: "Ingeschakeld",
				removeProvider: "Provider verwijderen",
				removeProviderAria: (label: string) => `Verwijder ${label || "provider"}`,
				empty: "Nog geen providers ingesteld. Voeg er een toe om te beginnen.",
				typeOpenaiCompatible: "OpenAI-compatibel",
				typeOpenrouter: "OpenRouter",
				typeGoogleGemini: "Google / Gemini",
				models: "Modellen",
				modelsBody:
					"Voeg elk model-ID toe dat deze provider aanbiedt. Afbeelding- en websearch-schakelaars hangen af van wat het endpoint ondersteunt.",
				addModel: "Model toevoegen",
				emptyModels: "Nog geen modellen ingesteld.",
				modelId: "Model-ID",
				modelLabel: "Weergavelabel",
				modelEnabled: "Zichtbaar in keuzelijst",
				supportsImages: "Ondersteunt afbeeldingen",
				webSearch: "Web search inschakelen",
				thinkingLevel: "Denkniveau",
				thinkingLevelDefault: "Provider-standaard",
				edit: "Bewerken",
				defaultLabel: "Standaard",
				disabledLabel: "Verborgen",
				webSearchBadge: "Web search",
				makeDefault: "Als standaard instellen",
				setDefaultAria: (label: string) =>
					`Stel ${label || "model"} in als standaard`,
				removeModelAria: (label: string) => `Verwijder ${label || "model"}`,
				toggleImagesAria: (label: string, enabled: boolean) =>
					`${enabled ? "Zet afbeeldingen uit voor" : "Zet afbeeldingen aan voor"} ${label || "model"}`,
				toggleWebSearchAria: (label: string, enabled: boolean) =>
					`${enabled ? "Zet web search uit voor" : "Zet web search aan voor"} ${label || "model"}`,
			},
			siteBlocklist: {
				title: "Site-blocklist",
				body:
					"Domeinen in deze lijst verbergen de AI-knop op die sites. `Voor altijd verbergen` voegt de huidige site hier toe.",
				addAria: "Voeg geblokkeerde site toe",
				empty: "Nog geen geblokkeerde sites.",
				removeAria: "Verwijder geblokkeerde site",
			},
			behavior: {
				title: "Gedrag",
				body: "Kies hoe de sidebar zich gedraagt tijdens lezen, typen en debuggen.",
				autoReadTitle: "Lees pagina-context automatisch",
				autoReadBody: "Laad context zodra de sidebar opent.",
				autoSendQuickActionsTitle: "Sneltoetsen automatisch verzenden",
				autoSendQuickActionsBody:
					"Verstuur de prompt direct bij het gebruik van Uitleggen of Vertalen vanuit de selectie-popup.",
				selectionPopupFocusTitle: "Selectie-popup pakt toetsenbordfocus",
				selectionPopupFocusBody:
					"Als dit uit staat, blijft de pagina toetsaanslagen ontvangen tot je op de popup klikt.",
				wrapTitle: "Assistenttekst afbreken",
				wrapBody: "Maak lange antwoorden beter leesbaar.",
				debugTitle: "Debuglogging inschakelen",
				debugBody: "Bewaar extra logs voor troubleshooting.",
				submitShortcut: "Sneltoets voor versturen",
				submitShiftEnter: "Shift+Enter verstuurt, Enter voegt nieuwe regel toe",
				submitEnter: "Enter verstuurt, Shift+Enter voegt nieuwe regel toe",
				popupTarget: "Doel voor Vraag AI vanuit selectie-popup",
				popupTargetCurrent: "Doorgaan in huidige chat",
				popupTargetNew: "Nieuwe chat starten",
				themeTitle: "Thema",
				themeBody: "Kies tussen een licht, donker of systeemthema.",
				themeLight: "Licht",
				themeDark: "Donker",
				themeSystem: "Systeem",
			},
			advanced: {
				title: "Geavanceerd",
				takeInput: {
					title: "Take input-modus",
					description:
						"Vraagt bij het versturen of ingevulde formuliervelden van de pagina worden meegestuurd.",
				},
				ignoredFields: {
					title: "Genegeerde invoervelden (één patroon per regel)",
					tooltip:
						"Velden waarvan naam, id of label met een van deze patronen overeenkomt worden nooit vastgelegd. Wachtwoord-, creditcard- en eenmalige-code-velden zijn altijd uitgesloten.",
				},
			},
			promptTemplates: {
				title: "Prompttemplates",
				body: "Pas de standaardprompts aan voor de selectie-acties.",
				ask: "Vraag AI-template",
				explain: "Uitleg-template",
				translate: "Vertaal-template",
				helper:
					"Gebruik {{selection}} waar de geselecteerde tekst moet worden ingevoegd.",
			},
			systemPrompt: {
				title: "System-prompt",
				body: "Geef globale instructies die de AI altijd moet volgen.",
				label: "Globale system-prompt",
				placeholder: "Je bent een behulpzame assistent...",
			},
			searchProviders: {
				title: "Zoekproviders",
				body:
					"Bewerk providers inline. Toon de providernaam en URL-template direct in de lijst.",
				addAria: "Voeg zoekprovider toe",
				addLabel: "Provider toevoegen",
				enableAria: (label: string) => `Schakel ${label || "zoekprovider"} in`,
				providerNamePlaceholder: "Providernaam",
				removeAria: "Verwijder zoekprovider",
			},
			modes: {
				title: "Agent Modes",
				body:
					"Beheer persona-instructies die aan de globale system-prompt worden toegevoegd. De aangevinkte mode wordt in chat gebruikt.",
				addMode: "Mode toevoegen",
				empty: "Nog geen agent modes ingesteld.",
				label: "Naam",
				removeModeAria: "Agent mode verwijderen",
				setActiveAria: (label: string) => `Gebruik ${label || "mode"} in chat`,
				activeLabel: "Actief",
			},
			mcp: {
				title: "MCP-integratie",
				body:
					"Verbind met externe Model Context Protocol servers of de lokale Cider4Me-bridge.",
				bridgeTitle: "Lokale Cider4Me-bridge",
				bridgeBody: "Pusht browserpagina-context en chatgeschiedenis naar je IDE.",
				bridgeUrl: "Bridge WebSocket URL",
				customServersTitle: "Aangepaste MCP-servers (Extensie-inwaarts)",
				addServer: "Server toevoegen",
				serverName: "Naam",
				serverUrl: "URL",
				transport: "Transport",
				connected: "Verbonden",
				disconnected: "Niet verbonden",
				testConnection: "Verbinding testen",
				empty: "Nog geen aangepaste MCP-servers ingesteld.",
			},
			debug: {
				title: "Debug",
				body: "Exporteer lokale debuglogs wanneer debugmodus is ingeschakeld.",
				export: "Logs exporteren",
			},
		},
		debugFooter: {
			title: "Debugmodus",
			body: "Toon gedetailleerde consolelogs voor troubleshooting.",
		},
		saveFeedback: {
			success: "Instellingen succesvol opgeslagen.",
			failure: "Opslaan van instellingen mislukt:",
		},
	},
	actions: {
		savedSelection: "Opgeslagen selectie",
		selectionContext: "Selectiecontext",
		pinnedSnippet: "Vastgepind fragment",
	},
	errors: {
		missingApiKey: "OpenAI-compatibele API-key is niet ingesteld",
		missingApiBaseUrl: "OpenAI-compatibele API-basis-URL is niet ingesteld",
		openRouterApiKeyRejected:
			"OpenRouter weigerde de API-key (401). Maak een nieuwe key op openrouter.ai/keys (`sk-or-v1-…`), geen management-key. Wacht op Opgeslagen en probeer opnieuw.",
		apiAuthenticationFailed: "Authenticatie mislukt",
		chatCompletionFailed: "Chat completion-verzoek mislukt",
		missingGoogleGeminiApiKey: "Google Gemini API-key is niet ingesteld",
		unknownChatError: "Onbekende chatfout",
		invalidSearchProvider:
			"Elke zoekprovider heeft zowel een naam als een URL nodig.",
		invalidModelId: "Een model-ID is verplicht.",
	},
};

export const translations: Record<AppLocale, TranslationDictionary> = {
	en,
	nl,
};
