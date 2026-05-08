import { morph } from "@morph-sdk/core";

// ─── Demo 1: Sidebar ─────────────────────────────────────────────────────────

const SIDEBAR_ITEMS = [
	{ id: "dashboard", label: "Dashboard" },
	{ id: "projects", label: "Projects" },
	{ id: "tasks", label: "Tasks" },
	{ id: "calendar", label: "Calendar" },
	{ id: "messages", label: "Messages" },
	{ id: "analytics", label: "Analytics" },
	{ id: "settings", label: "Settings" },
	{ id: "team", label: "Team" },
	{ id: "billing", label: "Billing" },
	{ id: "docs", label: "Docs" },
	{ id: "integrations", label: "Integrations" },
	{ id: "support", label: "Support" },
];

function renderSidebar() {
	const container = document.getElementById("sidebar-demo")!;
	const content = document.getElementById("sidebar-content")!;
	const ranked = morph.rank("sidebar");

	const topItems = ranked.filter((r) => r.isActive).slice(0, 3);

	let quickAccess = "";
	if (topItems.length > 0) {
		quickAccess = `
			<div class="mb-2 pb-2 border-b border-neutral-200">
				<div class="px-3 py-1 text-xs text-neutral-400 uppercase tracking-wider">Quick Access</div>
				${topItems
					.map((item) => {
						const label = SIDEBAR_ITEMS.find((s) => s.id === item.id)?.label ?? item.id;
						return `
							<button class="flex items-center justify-between px-3 py-1.5 text-sm text-neutral-900 font-medium bg-yellow-50 hover:bg-yellow-100 text-left transition-colors w-full" data-id="${item.id}">
								<span>${label}</span>
								<span class="text-xs text-yellow-600 tabular-nums">${item.score.toFixed(1)}</span>
							</button>
						`;
					})
					.join("")}
			</div>
		`;
	}

	const navItems = SIDEBAR_ITEMS.map((item) => {
		const data = ranked.find((r) => r.id === item.id);
		const isActive = data?.isActive ?? false;

		const highlight = isActive ? "bg-neutral-100 font-medium text-neutral-900" : "text-neutral-600";

		return `
			<button class="flex items-center justify-between px-3 py-1.5 text-sm ${highlight} hover:bg-neutral-100 text-left transition-colors" data-id="${item.id}">
				<span>${item.label}</span>
				${isActive ? '<span class="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>' : ""}
			</button>
		`;
	}).join("");

	container.innerHTML = quickAccess + navItems;

	const activeCount = ranked.filter((r) => r.isActive).length;
	content.innerHTML = `
		<div class="text-xs text-neutral-400 uppercase tracking-widest mb-3">Stats</div>
		<div class="space-y-2 text-sm">
			<div class="flex justify-between border-b border-neutral-100 pb-2">
				<span class="text-neutral-500">Tracked</span>
				<span class="font-medium">${ranked.length} / ${SIDEBAR_ITEMS.length}</span>
			</div>
			<div class="flex justify-between border-b border-neutral-100 pb-2">
				<span class="text-neutral-500">Active</span>
				<span class="font-medium">${activeCount}</span>
			</div>
			<div class="flex justify-between border-b border-neutral-100 pb-2">
				<span class="text-neutral-500">Top item</span>
				<span class="font-medium">${ranked[0]?.id ?? "—"}</span>
			</div>
		</div>
		<p class="mt-4 text-xs text-neutral-400 leading-relaxed">Click items on the left. Frequently used items appear in Quick Access — navigation order stays stable.</p>
	`;

	container.querySelectorAll("button[data-id]").forEach((btn) => {
		btn.addEventListener("click", () => {
			const id = (btn as HTMLElement).dataset.id!;
			morph.track("sidebar", id);
			flashButton(btn as HTMLElement);
			renderSidebar();
		});
	});
}

// ─── Demo 2: Command Palette ─────────────────────────────────────────────────

const COMMANDS = [
	{ id: "new-file", label: "New File", shortcut: "⌘N" },
	{ id: "open-file", label: "Open File", shortcut: "⌘O" },
	{ id: "save", label: "Save", shortcut: "⌘S" },
	{ id: "save-as", label: "Save As...", shortcut: "⇧⌘S" },
	{ id: "find", label: "Find", shortcut: "⌘F" },
	{ id: "replace", label: "Find and Replace", shortcut: "⌘H" },
	{ id: "format", label: "Format Document", shortcut: "⇧⌥F" },
	{ id: "terminal", label: "Toggle Terminal", shortcut: "⌃`" },
	{ id: "sidebar", label: "Toggle Sidebar", shortcut: "⌘B" },
	{ id: "palette", label: "Command Palette", shortcut: "⇧⌘P" },
	{ id: "git-commit", label: "Git: Commit", shortcut: "" },
	{ id: "git-push", label: "Git: Push", shortcut: "" },
	{ id: "split-editor", label: "Split Editor", shortcut: "⌘\\" },
	{ id: "close-tab", label: "Close Tab", shortcut: "⌘W" },
	{ id: "reopen-tab", label: "Reopen Closed Tab", shortcut: "⇧⌘T" },
];

function renderCommands(filter = "") {
	const list = document.getElementById("command-list")!;
	const ranked = morph.rank("commands");

	const filtered = COMMANDS
		.filter((cmd) => cmd.label.toLowerCase().includes(filter.toLowerCase()))
		.sort((a, b) => {
			const rankA = ranked.find((r) => r.id === a.id)?.rank ?? Infinity;
			const rankB = ranked.find((r) => r.id === b.id)?.rank ?? Infinity;
			return rankA - rankB;
		});

	list.innerHTML = filtered
		.map((cmd) => {
			const data = ranked.find((r) => r.id === cmd.id);
			const isActive = data?.isActive ?? false;

			return `
				<button class="flex items-center justify-between w-full px-4 py-2 text-sm border-b border-neutral-100 last:border-0 hover:bg-neutral-50 text-left transition-colors ${isActive ? "text-neutral-900 font-medium" : "text-neutral-600"}" data-id="${cmd.id}">
					<span>${cmd.label}</span>
					<div class="flex items-center gap-2">
						${isActive ? '<span class="text-xs text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">frequent</span>' : ""}
						<span class="text-xs text-neutral-300 font-mono">${cmd.shortcut}</span>
					</div>
				</button>
			`;
		})
		.join("");

	list.querySelectorAll("button[data-id]").forEach((btn) => {
		btn.addEventListener("click", () => {
			const id = (btn as HTMLElement).dataset.id!;
			morph.track("commands", id);
			flashButton(btn as HTMLElement);
			renderCommands(filter);
		});
	});
}

// ─── Demo 3: Action Toolbar ──────────────────────────────────────────────────

const TOOLBAR_ACTIONS = [
	{ id: "bold", label: "B" },
	{ id: "italic", label: "I" },
	{ id: "underline", label: "U" },
	{ id: "strikethrough", label: "S" },
	{ id: "heading-1", label: "H1" },
	{ id: "heading-2", label: "H2" },
	{ id: "heading-3", label: "H3" },
	{ id: "bullet-list", label: "UL" },
	{ id: "numbered-list", label: "OL" },
	{ id: "blockquote", label: "BQ" },
	{ id: "code-block", label: "<>" },
	{ id: "link", label: "LN" },
	{ id: "image", label: "IMG" },
	{ id: "table", label: "TBL" },
	{ id: "divider", label: "—" },
	{ id: "undo", label: "↩" },
	{ id: "redo", label: "↪" },
];

function renderToolbar() {
	const container = document.getElementById("toolbar-demo")!;
	const ranked = morph.rank("toolbar");

	const topItems = ranked.filter((r) => r.isActive).slice(0, 3);

	let quickAccess = "";
	if (topItems.length > 0) {
		quickAccess = topItems
			.map((item) => {
				const action = TOOLBAR_ACTIONS.find((a) => a.id === item.id);
				return `
					<button class="w-9 h-9 flex items-center justify-center text-xs font-mono border bg-yellow-50 text-neutral-900 border-yellow-300 ring-2 ring-yellow-200 transition-all" data-id="${item.id}" title="${item.id}">
						${action?.label ?? item.id}
					</button>
				`;
			})
			.join("") + '<span class="w-px h-7 bg-neutral-200 mx-1"></span>';
	}

	const allButtons = TOOLBAR_ACTIONS.map((action) => {
			const data = ranked.find((r) => r.id === action.id);
			const isActive = data?.isActive ?? false;

			const style = isActive
				? "bg-yellow-50 text-neutral-900 border-yellow-300 ring-2 ring-yellow-200"
				: "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400";

			return `
				<button class="w-9 h-9 flex items-center justify-center text-xs font-mono border ${style} transition-all" data-id="${action.id}" title="${action.id}">
					${action.label}
				</button>
			`;
		})
		.join("");

	container.innerHTML = quickAccess + allButtons;

	container.querySelectorAll("button[data-id]").forEach((btn) => {
		btn.addEventListener("click", () => {
			const id = (btn as HTMLElement).dataset.id!;
			morph.track("toolbar", id);
			flashButton(btn as HTMLElement);
			renderToolbar();
		});
	});
}

// ─── Utils ───────────────────────────────────────────────────────────────────

function flashButton(el: HTMLElement) {
	el.classList.add("bg-neutral-200");
	setTimeout(() => el.classList.remove("bg-neutral-200"), 150);
}

// ─── Init ────────────────────────────────────────────────────────────────────

renderSidebar();
renderCommands();
renderToolbar();

document.getElementById("command-search")?.addEventListener("input", (e) => {
	renderCommands((e.target as HTMLInputElement).value);
});

document.getElementById("sidebar-refresh")?.addEventListener("click", renderSidebar);
document.getElementById("sidebar-reset")?.addEventListener("click", () => {
	morph.reset("sidebar");
	renderSidebar();
});

document.getElementById("commands-refresh")?.addEventListener("click", () => renderCommands());
document.getElementById("commands-reset")?.addEventListener("click", () => {
	morph.reset("commands");
	renderCommands();
});

document.getElementById("toolbar-refresh")?.addEventListener("click", renderToolbar);
document.getElementById("toolbar-reset")?.addEventListener("click", () => {
	morph.reset("toolbar");
	renderToolbar();
});
