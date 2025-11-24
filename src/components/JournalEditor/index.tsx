import React, { useState } from 'react';
import { JournalEntry, View } from '../../types';
import { ModeSelector } from './ModeSelector';
import { FreestyleEditor } from './FreestyleEditor';
import { GuidedEditor } from './GuidedEditor';

interface JournalEditorProps {
  addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEntry: (id: string, updatedData: Partial<JournalEntry>) => void;
  setCurrentView: (view: View) => void;
}

type EditorMode = 'selection' | 'freestyle' | 'guided';

/**
 * JournalEditor - Main orchestrator component
 * Refactored to follow the Composition Pattern:
 * - Delegates to specialized sub-components (FreestyleEditor, GuidedEditor, ModeSelector)
 * - No longer a "God Component" - each sub-component handles its own concerns
 * - Follows Single Responsibility Principle for better testability and maintainability
 */
const JournalEditor: React.FC<JournalEditorProps> = ({ addEntry, updateEntry, setCurrentView }) => {
  const [mode, setMode] = useState<EditorMode>('selection');

  // Simple delegation - no complex logic here
  if (mode === 'selection') {
    return <ModeSelector onSelect={setMode} setCurrentView={setCurrentView} />;
  }

  if (mode === 'freestyle') {
    return (
      <FreestyleEditor
        addEntry={addEntry}
        setCurrentView={setCurrentView}
        onBack={() => setMode('selection')}
      />
    );
  }

  // mode === 'guided'
  return (
    <GuidedEditor
      addEntry={addEntry}
      onBack={() => setMode('selection')}
    />
  );
};

export default JournalEditor;
