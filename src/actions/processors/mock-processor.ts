import { Injectable } from '@nestjs/common';

@Injectable()
export class MockProcessor {
  /**
   * Mock processor that produces deterministic results based on input
   */
  async process(
    scope: { type: string; name?: string; ids?: string[] },
    messages: Array<{ role: string; content: string }>,
    actions: string[],
    context: Array<{ title: string; content: string }>,
  ): Promise<{ results: any[] }> {
    const results: any[] = [];

    // Deterministic mock processing
    const userMessage = messages.find((m) => m.role === 'user');
    const userContent = userMessage?.content || '';

    for (const action of actions) {
      if (action === 'make_document') {
        // Generate deterministic document
        const docContent = this.generateDocumentContent(
          userContent,
          context,
          scope,
        );
        results.push({
          action: 'make_document',
          content: docContent,
          type: 'document',
        });
      } else if (action === 'make_csv') {
        // Generate deterministic CSV
        const csvContent = this.generateCSVContent(userContent, context, scope);
        results.push({
          action: 'make_csv',
          content: csvContent,
          type: 'csv',
        });
      }
    }

    return { results };
  }

  private generateDocumentContent(
    userMessage: string,
    context: Array<{ title: string; content: string }>,
    scope: any,
  ): string {
    const contextSummary = context
      .map((c) => `${c.title}: ${c.content.substring(0, 100)}`)
      .join('\n');

    return `Generated Document
User Request: ${userMessage}
Scope: ${scope.type} ${scope.name || scope.ids?.join(',') || ''}
Context:
${contextSummary}

This is a deterministically generated document based on the provided context and user request.`;
  }

  private generateCSVContent(
    userMessage: string,
    context: Array<{ title: string; content: string }>,
    scope: any,
  ): string {
    // Generate CSV with headers
    const headers = ['Document', 'Title', 'Content Preview'];
    const rows = context.map((c, index) => [
      `doc_${index + 1}`,
      c.title,
      c.content.substring(0, 50),
    ]);

    const csvLines = [headers.join(','), ...rows.map((r) => r.join(','))];
    return csvLines.join('\n');
  }
}

