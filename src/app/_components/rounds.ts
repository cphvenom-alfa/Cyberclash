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
		n: 1,
		title: "System Activation",
		tagline: "Puzzles, riddles and logic against the clock.",
		summary:
			"Answer observation puzzles, tricky riddles and logic questions before the global timer runs out. Correct answers earn Point Currency you can spend in Round 2.",
		steps: [
			"Wait for the organizers to start the clock.",
			"Answer as many questions as you can. Each answer locks when submitted.",
			"When the timer ends, any answer you typed is submitted automatically.",
		],
		scoring:
			"Each correct answer adds to your point balance. Teams advance to Round 2.",
		tip: "Points are currency. The more you bank now, the more hints you can afford later.",
	},
	{
		n: 2,
		title: "Encrypted Access",
		tagline: "Decode messages. Spend points wisely.",
		summary:
			"Decrypt a set of encrypted messages. If you get stuck, spend points on help in the Hint Market. Messages you decode become clues for Round 3.",
		steps: [
			"Read each encrypted message and work out how it was hidden.",
			"Buy hints if needed: 2 points for the cipher type, 4 for the method, or 6 for a partial message.",
			"Submit your decoded text for each message.",
		],
		scoring:
			"Your score combines successful decryptions with the points you retain. The top teams advance to Round 3.",
		tip: "A hint can save a message, but every point spent reduces your score.",
	},
	{
		n: 3,
		title: "Blackbox Investigation",
		tagline: "Read the case file. Catch the cybercriminal.",
		summary:
			"Shortlisted teams get a digital case file with characters, conversations, emails and access logs. Combine it with your Round 2 clues to answer seven investigation questions.",
		steps: [
			"Study the evidence and your decoded messages.",
			"Answer all seven questions, including who did it, when it happened and how they got in.",
			"Submit before the organizers close the round.",
		],
		scoring:
			"Organizers grade your answers by hand. Clear reasoning that connects the clues matters. The top four teams reach the final.",
		tip: "Explain how you know. A well-supported answer scores better than a bare name.",
	},
	{
		n: 4,
		title: "Cipher Battle Royale",
		tagline: "Head-to-head. Fastest decoder wins.",
		summary:
			"Finalists receive a sentence and a cipher method, encrypt it, and send it to their opponent after organizer approval. Then both teams race to decrypt the opponent's message.",
		steps: [
			"Encrypt your assigned sentence with the assigned cipher.",
			"Wait for admin approval. The countdown starts for both teams.",
			"Decrypt your opponent's message. There are no hints and one attempt.",
		],
		scoring:
			"If both teams decode correctly, the faster submission wins. A tie goes to sudden death with a fresh message.",
		tip: "Double-check your encryption. An error can make the message impossible to solve and may be rejected by organizers.",
	},
];
