#  AKIS Tracking Utility

> **Internal development utility designed to track, manage, and monitor the development progress of our ongoing game project, AKIS.**

Live Tracker: [tracker-akis.vercel.app](https://tracker-akis.vercel.app/)

---

##  Overview

**AKIS Tracking Utility** is a centralized development dashboard and CRUD checklist built for the **AKIS** game development team. It provides real-time visibility into feature implementation across all core game subsystems, enabling the team to organize priorities, track work-in-progress mechanics, and maintain momentum towards production milestones.

---

##  Tracked Game Systems

The utility monitors and manages tasks across all primary modules of the AKIS game engine:

| System | Description | Key Focus Areas |
| :--- | :--- | :--- |
| **Interaction** | Player world interactions | Item pickups, door toggles, dialogue triggers, interactive terminals |
| **Inventory** | Item & equipment management | Slot grids, equipment slots, weight limits, hotbars, stacking logic |
| **Enemy** | AI & combat systems | Perception (vision/hearing), patrol routing, attack states, aggro tables |
| **Camera** | Visual perspectives & feel | Rig behaviors, obstacle collision/clipping, FOV shifts, dynamic smoothing |
| **Locomotion** | Player movement mechanics | Sprint, crouch, jump, sliding, air control, stamina consumption |
| **Props** | Interactive & physical world assets | Destructibles, physics bodies, static environmental assets, interactive items |
|  **Character** | Hero stats, attributes & visual rig | Health/mana systems, animation trees, rig sockets, cosmetic customization |

---

##  Key Features

- **Comprehensive Dashboard**: High-level visual telemetry of overall project completion, per-system completion percentages, and task distribution across status states.
- **Full CRUD Checklist**: Add, edit, prioritize, and delete tasks for every individual game subsystem.
- **Status Workflow**: Seamlessly cycle tasks through `Not Started` ➔ `Working` ➔ `Done` with one-click toggles.
- **Priority Tagging**: Classify backlog items into `High`, `Medium`, and `Low` priority to streamline sprint planning.
- **Search & Filter**: Instant filtering by task name, description, priority level, and completion status.
- **Supabase Cloud Sync**: Real-time cloud persistence backed by PostgreSQL, ensuring team-wide synchronization.
- **Team Authentication**: Built-in authentication support with Row Level Security (RLS) safeguards.

---

##  Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite 8](https://vite.dev/)
- **Backend / Database**: [Supabase](https://supabase.com/) (PostgreSQL + Auth + Realtime)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Linter**: [Oxlint](https://oxc.rs/)

---


##  Game Project Context

This tracker is part of the internal utilities supporting the **AKIS** game project development pipeline. For issues, feature requests, or system additions, consult the core game development team.