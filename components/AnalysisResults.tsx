import React from 'react';
import { FileTextIcon, ShieldCheckIcon } from './icons';

type RiskLevel = 'Low' | 'Medium' | 'High';

interface WebSource {
    uri: string;
    title: string;
}

// Define the types for the analysis results
interface Clause {
    clauseType: string;
    summary: string;
    extractedText: string;
    riskLevel: RiskLevel;
    riskExplanation: string;
    complianceAnalysis?: string;
    complianceSources?: WebSource[];
}

interface ContractAnalysis {
    fileName: string;
    clauses: Clause[];
}

export interface AnalysisResultData {
    analysisResults: ContractAnalysis[];
}

interface AnalysisResultsProps {
    results: AnalysisResultData;
    onReset: () => void;
}

const riskLevelStyles: Record<RiskLevel, string> = {
    Low: 'bg-green-100 text-green-800 border-green-200',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    High: 'bg-red-100 text-red-800 border-red-200',
};

const RiskBadge: React.FC<{ level: RiskLevel }> = ({ level }) => (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${riskLevelStyles[level]}`}>
        {level} Risk
    </span>
);

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ results, onReset }) => {
    // A fallback in case the AI returns an empty or malformed result
    if (!results || !results.analysisResults || results.analysisResults.length === 0) {
        return (
             <div className="space-y-8 animate-fade-in text-center">
                <h1 className="text-3xl font-bold text-charcoal tracking-tight">Analysis Complete</h1>
                <div className="p-8 bg-surface border border-gray-200/80 rounded-2xl shadow-sm">
                    <p className="mt-2 text-gray-600">
                        The AI could not extract any information from the provided document(s). This can happen if the file is empty, password-protected, or not a text-based PDF.
                    </p>
                </div>
                <div className="flex justify-center pt-8">
                    <button
                        onClick={onReset}
                        className="px-8 py-3.5 border border-transparent rounded-xl shadow-sm text-base font-semibold text-charcoal bg-mustard hover:bg-mustard/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mustard transition-all duration-300"
                    >
                        Try Another Contract
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-charcoal tracking-tight">Analysis Complete</h1>
                <p className="mt-2 text-gray-500">
                    Review the extracted clauses and risk assessment from your documents below.
                </p>
            </div>

            <div className="space-y-10">
                {results.analysisResults.map((contract, index) => (
                    <div key={index} className="p-6 sm:p-8 bg-surface border border-gray-200/80 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                             <FileTextIcon className="w-6 h-6 text-mustard flex-shrink-0" />
                            <h2 className="text-xl font-semibold text-charcoal truncate">{contract.fileName}</h2>
                        </div>
                        
                        <div className="space-y-6">
                            {contract.clauses && contract.clauses.length > 0 ? (
                                contract.clauses.map((clause, clauseIndex) => (
                                    <div key={clauseIndex} className="p-5 bg-cream rounded-xl border border-gray-200/80">
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
                                            <h3 className="font-semibold text-charcoal text-lg">{clause.clauseType}</h3>
                                            <RiskBadge level={clause.riskLevel} />
                                        </div>
                                        
                                        <p className="text-sm text-gray-600">{clause.summary}</p>
                                        
                                        <div className="mt-4 p-4 bg-white/70 rounded-lg border border-gray-200/80">
                                            <h4 className="font-semibold text-sm text-charcoal">Lawyer's Note:</h4>
                                            <p className="mt-1 text-sm text-gray-700">{clause.riskExplanation}</p>
                                        </div>

                                        {clause.complianceAnalysis && (
                                            <details className="mt-4 group">
                                                <summary className="cursor-pointer list-none p-4 bg-blue-50/50 rounded-lg border border-blue-200/60 hover:bg-blue-100/50 transition-colors group-open:rounded-b-none">
                                                    <div className="flex items-center gap-2">
                                                        <ShieldCheckIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                                        <h4 className="font-semibold text-sm text-blue-800">Compliance Breakdown (Australian Law)</h4>
                                                        <div className="ml-auto text-blue-700">
                                                            <span className="group-open:hidden text-xs font-medium">View</span>
                                                            <span className="hidden group-open:inline text-xs font-medium">Hide</span>
                                                        </div>
                                                    </div>
                                                </summary>
                                                <div className="p-4 bg-blue-50/50 rounded-b-lg border-x border-b border-blue-200/60">
                                                    <div className="text-sm text-gray-700 whitespace-pre-wrap font-sans prose prose-sm max-w-none marker:text-gray-500">
                                                        {clause.complianceAnalysis}
                                                    </div>
                                                    {clause.complianceSources && clause.complianceSources.length > 0 && (
                                                        <div className="mt-4 pt-4 border-t border-blue-200/60">
                                                            <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Sources:</h5>
                                                            <ul className="mt-2 space-y-1">
                                                                {clause.complianceSources.map((source, sourceIdx) => (
                                                                    <li key={sourceIdx} className="text-xs flex items-start">
                                                                        <div className="text-mustard mr-2 mt-1 flex-shrink-0">&bull;</div>
                                                                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline break-all">
                                                                            {source.title}
                                                                        </a>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </details>
                                        )}

                                        <details className="mt-4 text-sm group">
                                            <summary className="cursor-pointer font-medium text-charcoal/80 hover:text-charcoal list-none">
                                                <span className="group-open:hidden">View extracted text</span>
                                                <span className="hidden group-open:inline">Hide extracted text</span>
                                            </summary>
                                            <blockquote className="mt-2 pl-4 py-2 border-l-4 border-mustard bg-surface rounded-r-lg">
                                                <p className="italic text-gray-500 whitespace-pre-wrap font-mono text-xs">"{clause.extractedText}"</p>
                                            </blockquote>
                                        </details>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-4">No specific clauses could be extracted from this document. It may be a non-text PDF, scanned image, or not a valid contract.</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-center pt-8">
                <button
                    onClick={onReset}
                    className="px-8 py-3.5 border border-transparent rounded-xl shadow-sm text-base font-semibold text-charcoal bg-mustard hover:bg-mustard/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mustard transition-all duration-300"
                >
                    Analyze Another Contract
                </button>
            </div>
        </div>
    );
};

export default AnalysisResults;