# Submissions Module

Hackathon submission system: custom form templates, team formation, project submissions, judging, and rankings.

## Components

| Name | Description |
|------|-------------|
| template-builder.tsx | Organizer form builder for custom submission fields + criteria |
| template-field-editor.tsx | Single field config dialog (type, label, validation, options) |
| criteria-builder.tsx | Judging criteria editor (name, weight, maxScore) |
| submission-form.tsx | Dynamic form renderer for participants based on template fields |
| submission-gallery.tsx | Grid of submitted projects (public gallery) |
| submission-card.tsx | Project card in gallery with status badge |
| submission-detail.tsx | Full project view with two-column layout |
| team-manager.tsx | Team member list + invite/remove controls |
| team-invite-dialog.tsx | Dialog for inviting teammates by user ID |
| team-invite-accept.tsx | Accept/decline team invite page component |
| judge-dashboard.tsx | Judge's scoring interface with submission list |
| judge-score-card.tsx | Score a single submission across all criteria |
| rankings-table.tsx | Final rankings/leaderboard table |
| manage-submissions-tab.tsx | Organizer's submission management tab |
| manage-judging-tab.tsx | Organizer's judging management tab |

## Patterns

- All components are "use client" with `useTransition` for server actions
- UI text in Spanish (Peru-focused platform)
- Server actions from `@/lib/actions/submissions`
- Types from `@/lib/db/schema` (SubmissionTemplate, Submission, etc.)
- Toast feedback via `sonner`
- File uploads via `@/lib/uploadthing` (submissionFileUploader endpoint)
- Template fields use jsonb with nanoid-generated IDs

## Dependencies

- `@/lib/actions/submissions` - All server actions
- `@/lib/db/schema` - Type definitions
- `@/lib/uploadthing` - File upload hooks
- `@/components/ui/*` - shadcn/ui components
- `lucide-react` - Icons
- `nanoid` - Field/criteria ID generation

## Anti-patterns

- Do NOT create separate tables for form fields (they're jsonb in the template)
- Do NOT bypass team size validation
- Do NOT show draft submissions in the public gallery
- Do NOT allow non-leads to edit submissions or invite members
