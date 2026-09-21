/**
 * RIDO Knowledge Base & RAG Semantic Search Engine
 * Implements Retrieval-Augmented Generation across the 4 Logistics SOP Documents.
 */

import { KNOWLEDGE_DOCUMENTS } from "../data/knowledgeDocs.js";

export class RAGEngine {
  constructor() {
    this.documents = KNOWLEDGE_DOCUMENTS;
    this.allChunks = [];
    this._indexChunks();
  }

  _indexChunks() {
    this.allChunks = [];
    for (const doc of this.documents) {
      for (const chunk of doc.chunks) {
        this.allChunks.push({
          documentId: doc.id,
          documentTitle: doc.title,
          category: doc.category,
          version: doc.version,
          lastUpdated: doc.lastUpdated,
          chunkId: chunk.chunkId,
          section: chunk.section,
          content: chunk.content,
          searchableTokens: this._tokenize(`${doc.title} ${chunk.section} ${chunk.content}`)
        });
      }
    }
  }

  _tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(t => t.length > 2);
  }

  /**
   * Search knowledge base with query tokens and TF-IDF style scoring
   */
  search(query, options = {}) {
    const { topK = 3, category = null, minScore = 0.1 } = options;
    const queryTokens = this._tokenize(query);

    if (queryTokens.length === 0) {
      return [];
    }

    const scored = this.allChunks
      .filter(item => !category || category === "All" || item.category === category)
      .map(item => {
        let matchCount = 0;
        let weightedScore = 0;

        for (const qToken of queryTokens) {
          const occurrences = item.searchableTokens.filter(t => t.includes(qToken) || qToken.includes(t)).length;
          if (occurrences > 0) {
            matchCount += 1;
            // Higher weight for matches in section title
            const inSection = item.section.toLowerCase().includes(qToken);
            weightedScore += (occurrences * 1.0) + (inSection ? 3.0 : 0);
          }
        }

        const normalizedScore = queryTokens.length > 0 ? weightedScore / (queryTokens.length * 2) : 0;

        return {
          ...item,
          score: parseFloat(normalizedScore.toFixed(3)),
          matchRatio: matchCount / queryTokens.length
        };
      })
      .filter(item => item.score >= minScore)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, topK);
  }

  getAllDocuments() {
    return this.documents;
  }
}
