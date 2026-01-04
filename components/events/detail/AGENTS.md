# Detail Module

## Purpose
Componentes para la página de detalle de evento `/e/[code]`.

## Components
| Component | Description |
|-----------|-------------|
| EventCountdown | Countdown timer hasta inicio/fin |
| EventLocationMap | Mapa embebido de ubicación |
| AttendanceButton | Botón para marcar asistencia |
| ManageEventButton | Botón de gestión (admin/owner) |
| WinnerSection | Display de ganadores post-evento |
| WinnerClaimDialog | Dialog para reclamar premio |
| AcceptCohostInviteButton | Aceptar invitación de co-host |

## Attendance States
- Claim attendance (no marcado)
- Self-reported (usuario marcó)
- Organizer-verified (verificado por organizador)

## Permissions
- ManageEventButton solo visible para owner/admin
- WinnerSection solo post-evento con ganadores
