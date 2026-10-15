import { QuestionPair } from '../types/game.ts';

export interface QuestionCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  pairs: QuestionPair[];
}

export const QUESTION_PACKS: QuestionCategory[] = [
  {
    id: 'party-classic',
    name: 'Party Classics',
    description: 'Funny and lively contrasts for any friend group or gathering',
    icon: '🎉',
    pairs: [
      {
        commonQuestion: 'Who is most likely to quit their job without notice?',
        imposterQuestion: 'Who is most likely to get employee of the month?',
        category: 'Party Classics'
      },
      {
        commonQuestion: 'Who would survive the longest in a zombie apocalypse?',
        imposterQuestion: 'Who would get eaten in the first 5 minutes of a zombie apocalypse?',
        category: 'Party Classics'
      },
      {
        commonQuestion: 'Who would you trust with your deepest secret?',
        imposterQuestion: 'Who is completely incapable of keeping a secret for more than 10 minutes?',
        category: 'Party Classics'
      },
      {
        commonQuestion: 'Who is most likely to become a self-made billionaire?',
        imposterQuestion: 'Who is most likely to lose all their life savings on a suspicious meme coin?',
        category: 'Party Classics'
      },
      {
        commonQuestion: 'Who would make the most inspiring President or World Leader?',
        imposterQuestion: 'Who would accidentally trigger an international diplomatic crisis by tweeting?',
        category: 'Party Classics'
      },
      {
        commonQuestion: 'Who is most likely to arrive 30 minutes early to an event?',
        imposterQuestion: 'Who is most likely to wake up when the party is already ending?',
        category: 'Party Classics'
      }
    ]
  },
  {
    id: 'chaos-unhinged',
    name: 'Chaos & Unhinged',
    description: 'Wild, contrasting scenarios guaranteed to spark heated debates',
    icon: '⚡',
    pairs: [
      {
        commonQuestion: 'Who gives the absolute best relationship and dating advice?',
        imposterQuestion: 'Who has the most chaotic, dumpster-fire dating history?',
        category: 'Chaos & Unhinged'
      },
      {
        commonQuestion: 'Who would be the hero in an action movie?',
        imposterQuestion: 'Who would be the comic relief character that gets trapped in an air duct?',
        category: 'Chaos & Unhinged'
      },
      {
        commonQuestion: 'Who is the most innocent and wholesome person here?',
        imposterQuestion: 'Who secretly has a dark villain arc waiting to unfold?',
        category: 'Chaos & Unhinged'
      },
      {
        commonQuestion: 'Who would cook a Michelin-star 5-course dinner from scratch?',
        imposterQuestion: 'Who would manage to burn water while making instant noodles?',
        category: 'Chaos & Unhinged'
      },
      {
        commonQuestion: 'Who is most likely to talk their way out of a speeding ticket?',
        imposterQuestion: 'Who would accidentally confess to three other unrelated crimes while being pulled over?',
        category: 'Chaos & Unhinged'
      }
    ]
  },
  {
    id: 'office-workplace',
    name: 'Work & Ambition',
    description: 'Great for colleagues, remote teams, and study buddies',
    icon: '💼',
    pairs: [
      {
        commonQuestion: 'Who is the most organized and dependable person on the team?',
        imposterQuestion: 'Who has 400 unread emails and an inbox that gives people nightmares?',
        category: 'Work & Ambition'
      },
      {
        commonQuestion: 'Who would give a stellar TED talk without any preparation?',
        imposterQuestion: 'Who would freeze on stage and ramble about their childhood hamster?',
        category: 'Work & Ambition'
      },
      {
        commonQuestion: 'Who is most likely to invent an AI startup that changes humanity?',
        imposterQuestion: 'Who still struggles to unmute themselves on Zoom meetings?',
        category: 'Work & Ambition'
      },
      {
        commonQuestion: 'Who works the hardest and puts in extra hours?',
        imposterQuestion: 'Who is a master at looking busy while doing absolutely nothing?',
        category: 'Work & Ambition'
      }
    ]
  },
  {
    id: 'quirky-social',
    name: 'Quirky Social',
    description: 'Everyday quirks and funny habits',
    icon: '🎭',
    pairs: [
      {
        commonQuestion: 'Who would cry tears of joy at a puppy rescue video?',
        imposterQuestion: 'Who has a heart of stone and didn’t even cry at The Lion King?',
        category: 'Quirky Social'
      },
      {
        commonQuestion: 'Who would remember everyone’s birthday and bring homemade cupcakes?',
        imposterQuestion: 'Who has to check Facebook just to remember their own sibling’s birthday?',
        category: 'Quirky Social'
      },
      {
        commonQuestion: 'Who is most likely to win a high-stakes trivia championship?',
        imposterQuestion: 'Who genuinely believed until recently that chocolate milk comes from brown cows?',
        category: 'Quirky Social'
      },
      {
        commonQuestion: 'Who has the best fashion sense and always dresses to impress?',
        imposterQuestion: 'Who would wear neon sweatpants and mismatched Crocs to a formal gala?',
        category: 'Quirky Social'
      }
    ]
  }
];

export function getRandomQuestionPair(): QuestionPair {
  const allPairs = QUESTION_PACKS.flatMap(p => p.pairs);
  const randomIndex = Math.floor(Math.random() * allPairs.length);
  return allPairs[randomIndex];
}
