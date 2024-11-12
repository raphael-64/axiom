export const createUserDecorationStyles = (clientId: string, color: string) => `
  .cursor-${clientId}-line {
    border-left: 2px solid ${color};
    position: absolute;
    height: 100%;
    margin-left: -2px;
  }
  .selection-${clientId} {
    background-color: ${color}33;
    position: absolute;
    pointer-events: none;
  }
  .monaco-editor .monaco-hover {
    border-color: ${color} !important;
  }
  .monaco-editor .monaco-hover-content {
    background-color: ${color};
  }
  .monaco-editor .monaco-hover-content > * {
    border: none !important;
  }
  .monaco-editor .hover-contents {
    padding: 0 2px !important;
  }
  .monaco-editor .monaco-hover .hover-row:first-child strong {
    color: white;
    font-size: 10px;
    font-weight: 500;
  }
`;
