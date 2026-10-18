// File: src/app/_components/rounds.ts
export type RoundInfo = {
  n: 1 | 2 | 3 | 4;
  title: string;
  tagline: string;
  summary: string;
  steps: string[];
  scoring: string;
  tip: string;
};

export const ROUNDS: RoundInfo[] = [
  {
    n: 1, title: "System Activation", tagline: "Puzzles, riddles and logic against the clock.",
    summary: "Answer observation puzzles, tricky riddles and logical reasoning questions before the global timer runs out. Every correct answer earns Point Currency you can spend in Round 2.",
    steps: ["Wait for the organizers to start the clock.", "Answer as many questions as you can. Each answer locks when you submit it.", "When the timer ends, anything you typed is submitted automatically."],
    scoring: "Each correct answer adds to your point balance. Nobody is eliminated: every team moves on to Round 2.",
    tip: "Points are currency. The more you bank now, the more hints you can afford later.",
  },
  {
    n: 2, title: "Encrypted Access", tagline: "Decode messages. Spend points wisely.",
    summary: "Decrypt a set of encrypted messages. Stuck? Open the Hint Market and spend points on help. The messages you decode become your clues for Round 3.",
    steps: ["Read each encrypted message and work out how it was hidden.", "Buy hints if you need them: 2 points for the cipher type, 4 for the decoding method, 6 for a partial message.", "Submit your decoded text for each message."],
    scoring: "Your score combines successful decryptions with the points you still hold. Solving without hints keeps your full balance. The top teams advance to Round 3.",
    tip: "A hint can save a message, but every point you spend is a point off your score.",
  },
  {
    n: 3, title: "Blackbox Investigation", tagline: "Read the case file. Catch the cybercriminal.",
    summary: "Shortlisted teams get a digital case file with characters, conversations, fake emails and access logs. Combine it with your Round 2 clues to answer 7 investigation questions.",
    steps: ["Study the evidence and your decoded messages.", "Answer all 7 questions, such as who did it, when it happened and how they got in.", "Submit before the organizers close the round."],
    scoring: "Organizers grade your answers by hand. They reward clear reasoning that connects the clues, not lucky guesses. The top 4 teams reach the final.",
    tip: "Explain how you know. A well-argued answer scores higher than a bare name.",
  },
  {
    n: 4, title: "Cipher Battle Royale", tagline: "Head-to-head. Fastest decoder wins.",
    summary: "Finalists receive a sentence and a cipher method, encrypt it, and send it to their opponent once the organizers approve it. Then both teams race to decrypt each other's message.",
    steps: ["Encrypt your assigned sentence with the assigned cipher.", "Wait for admin approval, then the countdown starts for both teams.", "Decrypt your opponent's message. No hints, one attempt."],
    scoring: "If both teams decode correctly, the faster submission wins. An exact tie goes to a sudden-death round with a fresh message.",
    tip: "Double-check your own encryption. A mistake makes your opponent's job impossible, and the organizers may reject it.",
  },
];
