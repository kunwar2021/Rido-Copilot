/**
 * RIDO Knowledge Base SOP Reader & Inspector Module
 */

import { KNOWLEDGE_DOCUMENTS } from "../data/knowledgeDocs.js";
import { RAGEngine } from "../agent/ragEngine.js";

export class KnowledgeBaseModule {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.rag = new RAGEngine();
    this.selectedDocId = KNOWLEDGE_DOCUMENTS[0].id;
    this.searchResults = null;
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="knowledge-header mb-6">
        <h2 class="text-2xl font-bold text-white flex items-center gap-2">
          <i class="ri-book-open-line text-blue-400"></i>
          Knowledge Storage & SOP Compliance Documents
        </h2>
        <p class="text-slate-400 text-sm">Official Logistics SOPs, Vehicle Policies, and Safety Manuals used by Microsoft Foundry RAG</p>
      </div>

      <!-- Search Bar -->
      <div class="glass-panel p-4 rounded-2xl border border-slate-700/50 mb-6">
        <div class="flex gap-3 items-center">
          <div class="relative flex-1">
            <i class="ri-search-line absolute left-3.5 top-3 text-slate-400"></i>
            <input
              type="text"
              id="sopSearchInput"
              placeholder="Search SOP compliance rules (e.g. 'cold chain limit', 'tire pressure', 'driving hours', 'accident SOP')..."
              class="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>
          <button id="sopSearchBtn" class="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold">
            Search RAG
          </button>
        </div>
      </div>

      <!-- Main Layout: Doc Selector (Left) & Content (Right) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Document Tabs -->
        <div class="lg:col-span-4 space-y-3">
          ${KNOWLEDGE_DOCUMENTS.map(doc => `
            <div
              class="doc-tab-card cursor-pointer p-4 rounded-xl border transition ${doc.id === this.selectedDocId ? 'bg-blue-950/40 border-blue-500/60 shadow-lg shadow-blue-500/10' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'}"
              data-doc-id="${doc.id}"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-mono font-bold text-blue-400">${doc.id}</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">${doc.category}</span>
              </div>
              <h4 class="text-sm font-bold text-white mb-1">${doc.title}</h4>
              <p class="text-xs text-slate-400">Updated: ${doc.lastUpdated} • ${doc.version}</p>
            </div>
          `).join("")}
        </div>

        <!-- Document Viewer Content -->
        <div class="lg:col-span-8 glass-panel p-6 rounded-2xl border border-slate-700/50 min-h-[480px]">
          <div id="docViewerContent">
            ${this._renderDocContent(this.selectedDocId)}
          </div>
        </div>
      </div>
    `;

    this._attachEvents();
  }

  _renderDocContent(docId) {
    const doc = KNOWLEDGE_DOCUMENTS.find(d => d.id === docId);
    if (!doc) return `<p class="text-slate-400">Document not found.</p>`;

    return `
      <div class="border-b border-slate-800 pb-4 mb-5 flex justify-between items-start">
        <div>
          <span class="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">Document Reference: ${doc.id}</span>
          <h3 class="text-xl font-bold text-white mt-1">${doc.title}</h3>
          <p class="text-xs text-slate-400 mt-0.5">Category: ${doc.category} | Version: ${doc.version} | Last Verified: ${doc.lastUpdated}</p>
        </div>
        <span class="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
          <i class="ri-checkbox-circle-line"></i> Active SOP
        </span>
      </div>

      <div class="space-y-4">
        ${doc.chunks.map((chunk, idx) => `
          <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div class="flex items-center justify-between mb-2">
              <h5 class="text-sm font-bold text-blue-400 flex items-center gap-2">
                <span class="w-5 h-5 rounded bg-blue-600/30 text-blue-400 flex items-center justify-center text-xs font-mono">${idx + 1}</span>
                ${chunk.section}
              </h5>
              <span class="text-[10px] font-mono text-slate-500">Chunk: ${chunk.chunkId}</span>
            </div>
            <p class="text-xs text-slate-300 leading-relaxed">${chunk.content}</p>
          </div>
        `).join("")}
      </div>
    `;
  }

  _attachEvents() {
    const tabCards = this.container.querySelectorAll(".doc-tab-card");
    tabCards.forEach(card => {
      card.addEventListener("click", () => {
        this.selectedDocId = card.dataset.docId;
        this.render();
      });
    });

    const searchInput = document.getElementById("sopSearchInput");
    const searchBtn = document.getElementById("sopSearchBtn");

    const doSearch = () => {
      const q = searchInput?.value?.trim();
      if (!q) {
        this.render();
        return;
      }

      const results = this.rag.search(q, { topK: 6 });
      const viewer = document.getElementById("docViewerContent");
      if (viewer) {
        if (results.length === 0) {
          viewer.innerHTML = `
            <div class="text-center py-12">
              <i class="ri-file-search-line text-4xl text-slate-600 mb-2"></i>
              <p class="text-slate-400 text-sm">No matching SOP clauses found for "${q}".</p>
            </div>
          `;
          return;
        }

        viewer.innerHTML = `
          <div class="border-b border-slate-800 pb-3 mb-4 flex justify-between items-center">
            <h4 class="text-base font-bold text-white">RAG Search Results (${results.length} matches for "${q}")</h4>
            <button id="resetSearchBtn" class="text-xs text-blue-400 hover:underline">Reset View</button>
          </div>
          <div class="space-y-3">
            ${results.map(r => `
              <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition">
                <div class="flex justify-between items-center text-xs mb-1.5">
                  <span class="font-mono text-blue-400 font-bold">${r.documentId} — ${r.section}</span>
                  <span class="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 font-mono">Score: ${r.score}</span>
                </div>
                <p class="text-xs text-slate-300 leading-relaxed">${r.content}</p>
              </div>
            `).join("")}
          </div>
        `;

        document.getElementById("resetSearchBtn")?.addEventListener("click", () => this.render());
      }
    };

    if (searchBtn && searchInput) {
      searchBtn.addEventListener("click", doSearch);
      searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") doSearch();
      });
    }
  }
}
