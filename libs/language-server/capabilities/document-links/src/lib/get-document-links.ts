import { fileExists } from '@nx-console/file-system';
import { hasCompletionType, X_COMPLETION_TYPE } from '@nx-console/json-schema';
import { findProjectRoot } from '@nx-console/language-server/utils';
import {
  DocumentLink,
  JSONDocument,
  MatchingSchema,
  Range,
  TextDocument,
} from 'vscode-json-languageservice';

export async function getDocumentLinks(
  workingPath: string | undefined,
  jsonAst: JSONDocument,
  document: TextDocument,
  schemas: MatchingSchema[]
): Promise<DocumentLink[]> {
  if (!workingPath) {
    return [];
  }

  const links: DocumentLink[] = [];

  if (!jsonAst.root) {
    return [];
  }

  const projectRoot = findProjectRoot(jsonAst.root);
  const projectRootPath = workingPath + '/' + projectRoot;

  for (const { schema, node } of schemas) {
    if (hasCompletionType(schema)) {
      const linkType = schema[X_COMPLETION_TYPE];
      if (linkType === 'directory') {
        continue;
      }

      const position = document.positionAt(node.offset);
      const endPosition = document.positionAt(node.offset + node.length);
      const range = Range.create(position, endPosition);

      const fullPath = workingPath + '/' + node.value;
      if (!(await fileExists(fullPath))) {
        continue;
      }

      if (node.value === projectRoot) {
        links.push({
          range,
          target: projectRootPath,
        });
      } else {
        links.push(DocumentLink.create(range, fullPath));
      }
    }
  }

  return links;
}