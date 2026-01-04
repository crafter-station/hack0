# Creation Module

## Purpose
Formularios de creación y edición de organizaciones y eventos.

## Components
- OrgCreateForm - Form completo con AI autocomplete
- CreateTypeSelector - Selector de tipo
- OrgEventFormMinimal - Creación y edición de eventos (mode: create | edit)
- OnboardingForm - Wizard inicial
- LumaImportForm - Import desde Luma
- OrgScraperInput - Scraper de websites
- AiExtractModal - Modal de extracción AI

## OrgEventFormMinimal Modes

| Mode | Props adicionales | Comportamiento |
|------|-------------------|----------------|
| create | - | Org selector, Luma toggle, createEvent() |
| edit | event, sponsors | Pre-fill, SponsorManager, danger zone, updateEvent() |

## AI Integration
OrgScraperInput → Trigger.dev task → AI extraction
