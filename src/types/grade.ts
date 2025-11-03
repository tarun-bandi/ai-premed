export interface GradeScores {
	introduction: number;
	mentalPreparation: number;
	personality: number;
	ethics: number;
	schoolSpecificInterest: number;
}

export interface GradeResult {
	scores: GradeScores;
	overall: number;
	strength: string;
	improvements: string[];
}
