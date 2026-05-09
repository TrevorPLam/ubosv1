/**
 * @file        artifacts/api-server/src/lib/rag/chunker.ts
 * @module      RAG / Text Chunking
 * @purpose     Context-aware semantic text chunking for RAG pipeline
 *
 * @ai_instructions
 *   - Implement recursive character text splitting with semantic boundaries
 *   - Use sliding window overlap to preserve context between chunks
 *   - Prioritize natural language boundaries (paragraphs, sentences)
 *   - Return chunks with metadata for parent-child relationships
 *
 * @exports     chunkText function with configurable parameters
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

export interface ChunkOptions {
  maxChunkSize: number;
  overlapSize: number;
  minChunkSize: number;
}

export interface TextChunk {
  text: string;
  index: number;
  startIndex: number;
  endIndex: number;
  metadata?: {
    isStartOfParagraph?: boolean;
    isEndOfParagraph?: boolean;
    sentenceCount?: number;
  };
}

const DEFAULT_OPTIONS: ChunkOptions = {
  maxChunkSize: 1000,
  overlapSize: 200,
  minChunkSize: 100,
};

/**
 * Split text into chunks using recursive character splitting with semantic boundaries
 * Implements 2025 best practices for context-aware chunking
 */
export function chunkText(text: string, options: Partial<ChunkOptions> = {}): TextChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chunks: TextChunk[] = [];
  
  if (text.length <= opts.maxChunkSize) {
    return [{
      text,
      index: 0,
      startIndex: 0,
      endIndex: text.length,
      metadata: { isStartOfParagraph: true, isEndOfParagraph: true, sentenceCount: 1 }
    }];
  }

  // Split on paragraph boundaries first
  const paragraphs = text.split(/\n\s*\n/);
  let currentChunkText = '';
  let chunkIndex = 0;
  let globalIndex = 0;

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) continue;

    // If adding this paragraph would exceed max size, finalize current chunk
    if (currentChunkText.length + trimmedParagraph.length > opts.maxChunkSize && currentChunkText.length > 0) {
      // Create chunk with current content
      chunks.push(createChunk(currentChunkText, chunkIndex, globalIndex - currentChunkText.length));
      chunkIndex++;
      
      // Start new chunk with overlap from previous chunk
      const overlap = getOverlapText(currentChunkText, opts.overlapSize);
      currentChunkText = overlap + '\n\n' + trimmedParagraph;
    } else {
      // Add separator if not first content
      if (currentChunkText.length > 0) {
        currentChunkText += '\n\n';
      }
      currentChunkText += trimmedParagraph;
    }
    
    globalIndex += trimmedParagraph.length + 2; // +2 for \n\n
  }

  // Add final chunk if there's remaining content
  if (currentChunkText.length > 0) {
    chunks.push(createChunk(currentChunkText, chunkIndex, globalIndex - currentChunkText.length));
  }

  return chunks;
}

/**
 * Create a chunk object with metadata
 */
function createChunk(text: string, index: number, startIndex: number): TextChunk {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const isStartOfParagraph = !text.startsWith(' ');
  const isEndOfParagraph = !text.endsWith(' ') || text.endsWith('\n');

  return {
    text: text.trim(),
    index,
    startIndex,
    endIndex: startIndex + text.length,
    metadata: {
      isStartOfParagraph,
      isEndOfParagraph,
      sentenceCount: sentences.length
    }
  };
}

/**
 * Get overlap text from the end of a chunk
 */
function getOverlapText(text: string, overlapSize: number): string {
  if (text.length <= overlapSize) {
    return text;
  }
  
  // Try to find a good breaking point near the overlap size
  const overlapStart = text.length - overlapSize;
  const breakPoint = text.indexOf('. ', overlapStart);
  
  if (breakPoint !== -1 && breakPoint < text.length - 50) {
    return text.substring(breakPoint + 2); // +2 to skip ". "
  }
  
  return text.substring(overlapStart);
}

/**
 * Split large chunks into smaller ones if needed
 */
export function splitLargeChunks(chunks: TextChunk[], maxSize: number): TextChunk[] {
  const result: TextChunk[] = [];
  
  for (const chunk of chunks) {
    if (chunk.text.length <= maxSize) {
      result.push(chunk);
    } else {
      // Split large chunk on sentence boundaries
      const sentences = chunk.text.split(/(?<=[.!?])\s+/);
      let currentText = '';
      let sentenceIndex = 0;
      
      for (const sentence of sentences) {
        if (currentText.length + sentence.length > maxSize && currentText.length > 0) {
          result.push({
            text: currentText.trim(),
            index: chunk.index + sentenceIndex,
            startIndex: chunk.startIndex,
            endIndex: chunk.startIndex + currentText.length,
            metadata: chunk.metadata
          });
          currentText = sentence;
          sentenceIndex++;
        } else {
          if (currentText.length > 0) {
            currentText += ' ';
          }
          currentText += sentence;
        }
      }
      
      if (currentText.length > 0) {
        result.push({
          text: currentText.trim(),
          index: chunk.index + sentenceIndex,
          startIndex: chunk.startIndex,
          endIndex: chunk.startIndex + currentText.length,
          metadata: chunk.metadata
        });
      }
    }
  }
  
  return result;
}
