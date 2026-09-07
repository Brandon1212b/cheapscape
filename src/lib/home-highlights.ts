import { METHOD_ICONS, SKILL_ICONS } from "@/lib/method-icons";

export type HomeSkillHighlight = {
  skill: string;
  label: string;
  skillIcon: string;
  method: string;
  methodIcon: string;
};

/** Representative high-end method per skill for the landing page. */
export const HOME_SKILL_HIGHLIGHTS: HomeSkillHighlight[] = [
  {
    skill: "mining",
    label: "Mining",
    skillIcon: SKILL_ICONS.mining,
    method: "Infernal shale",
    methodIcon: METHOD_ICONS["infernal-shale"],
  },
  {
    skill: "agility",
    label: "Agility",
    skillIcon: SKILL_ICONS.agility,
    method: "Hallowed Sepulchre",
    methodIcon: METHOD_ICONS["hallowed-sepulchre"],
  },
  {
    skill: "herblore",
    label: "Herblore",
    skillIcon: SKILL_ICONS.herblore,
    method: "Mastering Mixology",
    methodIcon: METHOD_ICONS["mastering-mixology"],
  },
  {
    skill: "smithing",
    label: "Smithing",
    skillIcon: SKILL_ICONS.smithing,
    method: "Giants' Foundry",
    methodIcon: METHOD_ICONS["giants-foundry"],
  },
  {
    skill: "runecraft",
    label: "Runecraft",
    skillIcon: SKILL_ICONS.runecraft,
    method: "Guardians of the Rift",
    methodIcon: METHOD_ICONS["gotr-mass"],
  },
  {
    skill: "hunter",
    label: "Hunter",
    skillIcon: SKILL_ICONS.hunter,
    method: "Hunter rumours",
    methodIcon: METHOD_ICONS["hunter-rumours"],
  },
  {
    skill: "firemaking",
    label: "Firemaking",
    skillIcon: SKILL_ICONS.firemaking,
    method: "Wintertodt",
    methodIcon: METHOD_ICONS["wintertodt-mass"],
  },
  {
    skill: "thieving",
    label: "Thieving",
    skillIcon: SKILL_ICONS.thieving,
    method: "Pyramid Plunder",
    methodIcon: METHOD_ICONS["pyramid-plunder"],
  },
];
