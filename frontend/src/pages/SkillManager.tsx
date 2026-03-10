import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Badge } from '../components/ui/Badge';
import { Textarea } from '../components/ui/FormField';
import { Modal } from '../components/ui/Modal';
import { TourOverlay } from '../components/ui/TourOverlay';
import { useTour } from '../hooks/useTour';
import {
  BookOpen,
  Plus,
  Trash2,
  Eye,
  Code,
  Upload,
  ChevronDown,
  ChevronUp,
  Wrench,
  Tag,
  HelpCircle,
} from 'lucide-react';

const TOUR_STEPS = [
  {
    target: '[data-tour="loaded-skills"]',
    title: 'Loaded Skills',
    content: 'All currently registered agent skills displayed as cards. Each shows name, description, provider, model, tags for task matching, and available tools.',
    proTip: 'Skills are matched to subtasks by tags — use descriptive tags like "research", "coding", "analysis" for best matching.',
  },
  {
    target: '[data-tour="add-skill"]',
    title: 'Add New Skill',
    content: 'Create a new agent skill by pasting a .skill.md definition or uploading a file. Skills use YAML frontmatter for metadata and a markdown body for agent instructions.',
    example: 'Paste the example from the Format Reference below, modify name and instructions, then click "Save Skill".',
  },
  {
    target: '[data-tour="format-reference"]',
    title: 'Skill Format Reference',
    content: 'Expand this section to see the exact .skill.md format. YAML frontmatter needs: name, description, provider, model, tags, and tools.',
    proTip: 'Available tools: web_search, code_execute, file_read, file_write, api_call. Only assign tools the skill needs.',
  },
  {
    target: '[data-tour="available-tools"]',
    title: 'Available Tools',
    content: 'Reference of the 5 built-in tools you can assign to skills. Each tool gives agents specific capabilities during execution.',
    example: 'A "researcher" skill: web_search + file_write. A "coder" skill: code_execute + file_read + file_write.',
  },
];

interface Skill {
  id: string;
  name: string;
  description: string;
  provider: string;
  model: string;
  tags: string[];
  tools: string[];
  content: string;
}

const AVAILABLE_TOOLS = [
  { name: 'web_search', description: 'Search the web for information using queries' },
  { name: 'code_execute', description: 'Execute code snippets in a sandboxed environment' },
  { name: 'file_read', description: 'Read contents of files from the workspace' },
  { name: 'file_write', description: 'Write or update files in the workspace' },
  { name: 'api_call', description: 'Make HTTP requests to external APIs' },
];

const EXAMPLE_SKILL = `---
name: example-skill
description: A brief description of what this skill does
provider: anthropic
model: claude-sonnet-4-20250514
tags:
  - research
  - analysis
tools:
  - web_search
  - file_write
---

# Example Skill

Instruction content for the agent goes here.
Describe the behaviour, constraints, and output format.`;

export default function SkillManager() {
  const tour = useTour(TOUR_STEPS, 'skill-manager');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const [pasteContent, setPasteContent] = useState('');
  const [showReference, setShowReference] = useState(false);
  const [viewSkill, setViewSkill] = useState<Skill | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Skill | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const data = await api.listSkills();
      setSkills(data);
    } catch {
      showToast('error', 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleSave = async () => {
    if (!pasteContent.trim()) {
      showToast('error', 'Please paste a skill definition');
      return;
    }
    try {
      setSaving(true);
      await api.createSkill(pasteContent);
      showToast('success', 'Skill saved successfully');
      setPasteContent('');
      fetchSkills();
    } catch {
      showToast('error', 'Failed to save skill');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await api.createSkill(text);
      showToast('success', `Skill "${file.name}" uploaded successfully`);
      fetchSkills();
    } catch {
      showToast('error', 'Failed to upload skill file');
    }
    e.target.value = '';
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteSkill(deleteTarget.name);
      showToast('success', `Skill "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      fetchSkills();
    } catch {
      showToast('error', 'Failed to delete skill');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-600/90 text-white'
              : 'bg-red-600/90 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Tour */}
      {tour.isActive && (
        <TourOverlay
          step={tour.step}
          currentStep={tour.currentStep}
          totalSteps={tour.totalSteps}
          onNext={tour.next}
          onPrev={tour.prev}
          onFinish={tour.finish}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-7 w-7 text-indigo-400" />
          <h1 className="text-2xl font-bold text-white">Skill Manager</h1>
        </div>
        <button
          onClick={tour.start}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
        >
          <HelpCircle className="w-4 h-4" /> Guided Tour
        </button>
      </div>

      {/* Loaded Skills Grid */}
      <section data-tour="loaded-skills">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Loaded Skills</h2>
        {loading ? (
          <p className="text-slate-400">Loading skills...</p>
        ) : skills.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
            No skills loaded yet. Add one below.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 hover:border-indigo-700/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-base font-semibold text-white">{skill.name}</h3>
                  <Badge variant="outline" className="text-indigo-300 border-indigo-700/50 text-xs">
                    {skill.provider}
                  </Badge>
                </div>
                <p className="text-sm text-slate-400 line-clamp-2">{skill.description}</p>
                <p className="text-xs text-slate-500">
                  <Code className="inline h-3 w-3 mr-1" />
                  {skill.model}
                </p>
                {skill.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {skill.tags.map((tag) => (
                      <Badge key={tag} className="bg-indigo-600/20 text-indigo-300 text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                {skill.tools?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {skill.tools.map((tool) => (
                      <span
                        key={tool}
                        className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs"
                      >
                        <Wrench className="h-2.5 w-2.5 mr-1" />
                        {tool}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setViewSkill(skill)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                  <button
                    onClick={() => setDeleteTarget(skill)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-300 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add New Skill */}
      <section data-tour="add-skill" className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-white">Add New Skill</h2>
        </div>
        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
              activeTab === 'paste'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Code className="inline h-4 w-4 mr-1.5" />
            Paste Definition
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Upload className="inline h-4 w-4 mr-1.5" />
            Upload File
          </button>
        </div>
        {activeTab === 'paste' ? (
          <div className="space-y-3">
            <Textarea
              value={pasteContent}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPasteContent(e.target.value)}
              placeholder="Paste your .skill.md content here (YAML frontmatter + markdown body)..."
              className="w-full min-h-[200px] bg-slate-950 border-slate-700 text-slate-100 font-mono text-sm rounded-lg p-3 focus:border-indigo-500 focus:ring-indigo-500"
              rows={10}
            />
            <button
              onClick={handleSave}
              disabled={saving || !pasteContent.trim()}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? 'Saving...' : 'Save Skill'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="flex flex-col items-center justify-center w-full h-32 bg-slate-950 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors">
              <Upload className="h-8 w-8 text-slate-500 mb-2" />
              <span className="text-sm text-slate-400">Click to upload a .skill.md file</span>
              <input
                type="file"
                accept=".md,.skill.md"
                onChange={handleUpload}
                className="hidden"
              />
            </label>
          </div>
        )}
      </section>

      {/* Skill Format Reference */}
      <section data-tour="format-reference" className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowReference(!showReference)}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Skill Format Reference</h2>
          </div>
          {showReference ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </button>
        {showReference && (
          <div className="px-5 pb-5 space-y-4">
            <p className="text-sm text-slate-400">
              Skills use YAML frontmatter for metadata followed by a markdown body with agent
              instructions.
            </p>
            <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-sm text-slate-300 font-mono overflow-x-auto whitespace-pre">
              {EXAMPLE_SKILL}
            </pre>
          </div>
        )}
      </section>

      {/* Available Tools Reference */}
      <section data-tour="available-tools" className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-white">Available Tools</h2>
        </div>
        <div className="grid gap-3">
          {AVAILABLE_TOOLS.map((tool) => (
            <div
              key={tool.name}
              className="flex items-start gap-3 bg-slate-950 border border-slate-800 rounded-lg p-3"
            >
              <code className="text-indigo-300 bg-indigo-900/30 px-2 py-0.5 rounded text-sm font-mono whitespace-nowrap">
                {tool.name}
              </code>
              <span className="text-sm text-slate-400">{tool.description}</span>
            </div>
          ))}
        </div>
      </section>

      {/* View Modal */}
      {viewSkill && (
        <Modal open={!!viewSkill} onClose={() => setViewSkill(null)} title={viewSkill.name}>
          <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-sm text-slate-300 font-mono overflow-auto max-h-[60vh] whitespace-pre-wrap">
            {viewSkill.content}
          </pre>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete">
          <p className="text-slate-300 mb-4">
            Are you sure you want to delete the skill{' '}
            <span className="font-semibold text-white">"{deleteTarget.name}"</span>? This action
            cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 text-sm rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
