export interface GradeScores {
	contentRelevance: number;
	structureClarity: number;
	empathyProfessionalism: number;
	concisionTiming: number;
}

export interface GradeResult {
	scores: GradeScores;
	overall: number;
	strength: string;
	improvements: string[];
}
