import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ShieldCheckIcon, AlertTriangleIcon } from './icons';

interface WebSource {
    web: {
        uri: string;
        title: string;
    }
}

const ComplianceCheckPage: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [sources, setSources] = useState<WebSource[]>([]);

    const handleAnalyze = async () => {
        if (!inputText.trim()) {
            setError("Please enter some text to analyze.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        setSources([]);

        try {
            if (!process.env.API_KEY) {
                throw new Error("API key is not configured. Please contact the application administrator.");
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const prompt = `You are an expert AI legal assistant specializing in Australian law. Your task is to perform a compliance check on the following text.

Use Google Search to find the most current and relevant Australian legislation, regulations, and legal precedents related to the user's query.

Analyze the provided text meticulously:
"""
${inputText}
"""

Your analysis must include:
1.  A clear, high-level summary of whether the text appears compliant or not.
2.  Identification and a list of all potential compliance issues, legal risks, or unfair clauses.
3.  For each issue, an explanation of the risk and citation of the specific Australian law, regulation, or legal principle that applies.
4.  Concrete suggestions for amendments or alternative wording to improve compliance and fairness.

Structure your entire response using simple Markdown. Use headings (e.g., ### Summary), bullet points (*), and bold text for emphasis. Do not use any other formatting. Do not include any preamble or conversational text outside of the analysis itself.`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                },
            });

            const resultText = response.text;
            const groundingData = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];

            setAnalysisResult(resultText);
            setSources(groundingData.filter((s): s is WebSource => s.web?.uri != null && s.web.title != null));

        } catch (e: any) {
            console.error("Compliance check failed:", e);
            let errorMessage = "An unexpected error occurred during analysis.";
            if (e.message) {
                errorMessage = e.message;
            } else if (typeof e === 'string') {
                errorMessage = e;
            }
            if(e.message?.includes("API key not valid")) {
              errorMessage = "The provided API key is invalid. Please ensure it is configured correctly.";
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
        setInputText('');
        setError(null);
        setAnalysisResult(null);
        setSources([]);
    };
    
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-10 bg-surface rounded-2xl shadow-sm border border-gray-200/80 animate-fade-in">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-mustard"></div>
                <h2 className="mt-6 text-xl font-semibold text-charcoal">Verifying compliance...</h2>
                <p className="mt-2 text-gray-500">This may take a moment. We're consulting the latest legal sources.</p>
            </div>
        );
    }
    
    if (analysisResult) {
        return (
            <div className="space-y-8 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold text-charcoal tracking-tight">Compliance Analysis</h1>
                    <p className="mt-2 text-gray-500">
                        Here is the AI-powered analysis of your text based on current Australian law.
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-surface rounded-2xl border border-gray-200/80 shadow-sm">
                        <div className="text-gray-800 whitespace-pre-wrap font-sans prose prose-sm max-w-none">
                            {analysisResult}
                        </div>
                    </div>

                    {sources.length > 0 && (
                        <div className="p-6 bg-surface rounded-2xl border border-gray-200/80 shadow-sm">
                            <h3 className="text-base font-semibold text-charcoal mb-4">Sources</h3>
                            <ul className="space-y-3">
                                {sources.map((source, index) => (
                                    <li key={index} className="flex items-start">
                                        <div className="text-mustard mr-3 mt-1 flex-shrink-0">&bull;</div>
                                        <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-sm text-charcoal hover:underline hover:text-mustard transition-colors">
                                            {source.web.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                             <p className="mt-4 text-xs text-gray-500">Disclaimer: This AI analysis provides information, not legal advice. Consult a qualified lawyer for professional guidance.</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-center pt-6">
                    <button
                        onClick={handleReset}
                        className="px-8 py-3.5 border border-transparent rounded-xl shadow-sm text-base font-semibold text-charcoal bg-mustard hover:bg-mustard/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mustard transition-all duration-300"
                    >
                        Start New Check
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-charcoal tracking-tight">Compliance Check</h1>
                <p className="mt-2 text-gray-500">
                    Verify if your contract clauses or legal text comply with current Australian law.
                </p>
            </div>
            
            {error && (
                <div className="p-4 my-4 text-sm text-red-800 bg-red-100 rounded-xl flex items-center gap-3" role="alert">
                    <AlertTriangleIcon className="w-5 h-5 flex-shrink-0" />
                    <div><span className="font-bold">Analysis Failed:</span> {error}</div>
                </div>
            )}

            <div className="p-6 bg-surface rounded-2xl shadow-sm border border-gray-200/80">
                 <div className="flex items-start gap-4">
                    <ShieldCheckIcon className="w-8 h-8 text-mustard flex-shrink-0" />
                    <div>
                        <h2 className="text-lg font-semibold text-charcoal">Enter Text for Analysis</h2>
                        <p className="text-sm text-gray-500 mt-1">Paste the content you want to check into the text area below.</p>
                    </div>
                 </div>

                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste your contract clause or legal text here..."
                    className="mt-6 block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mustard min-h-[200px] font-mono text-sm"
                    aria-label="Text for compliance check"
                />
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end items-center pt-6 border-t border-gray-200/80 gap-4">
                <button
                    onClick={handleAnalyze}
                    disabled={!inputText.trim() || isLoading}
                    className="w-full sm:w-auto px-8 py-3.5 border border-transparent rounded-xl shadow-sm text-base font-semibold text-charcoal bg-mustard hover:bg-mustard/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mustard disabled:bg-amber-200 disabled:text-amber-700 disabled:cursor-not-allowed transition-all duration-300"
                >
                    {isLoading ? 'Analyzing...' : 'Check Compliance'}
                </button>
            </div>
        </div>
    );
};

export default ComplianceCheckPage;