import React, { useState, useCallback, useRef } from 'react';
import { UploadCloudIcon, FileTextIcon, ImageIcon, XIcon } from './icons';
import { GoogleGenAI, Type } from '@google/genai';
import AnalysisResults, { AnalysisResultData } from './AnalysisResults';

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const FileIcon = ({ file }: { file: File }) => {
    if (file.type.startsWith('image/')) {
        return <ImageIcon className="w-10 h-10 text-gray-500 flex-shrink-0" />;
    }
    return <FileTextIcon className="w-10 h-10 text-gray-500 flex-shrink-0" />;
};

const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
});

const ContractUploadPage: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResultData | null>(null);

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const newFiles = Array.from(e.dataTransfer.files);
            setFiles(prevFiles => [...prevFiles, ...newFiles.filter(nf => !prevFiles.some(pf => pf.name === nf.name && pf.size === nf.size))]);
            e.dataTransfer.clearData();
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
             const newFiles = Array.from(e.target.files);
             setFiles(prevFiles => [...prevFiles, ...newFiles.filter(nf => !prevFiles.some(pf => pf.name === nf.name && pf.size === nf.size))]);
        }
        if(e.target) e.target.value = '';
    };

    const removeFile = (fileName: string) => {
        setFiles(files.filter(file => file.name !== fileName));
    };

    const handleUploadAndAnalyze = async () => {
        if (files.length === 0) return;

        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        try {
            if (!process.env.API_KEY) {
                throw new Error("API key is not configured. Please contact the application administrator.");
            }
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const pdfFiles = files.filter(file => file.type === 'application/pdf');
            const otherFiles = files.filter(file => file.type !== 'application/pdf');

            if (otherFiles.length > 0) {
                 alert(`Warning: ${otherFiles.map(f => f.name).join(', ')} are not PDFs and will be ignored. This feature currently only supports PDF files.`);
            }

            if (pdfFiles.length === 0) {
                throw new Error("No PDF files selected. Please upload at least one PDF contract to analyze.");
            }

            const fileParts = await Promise.all(pdfFiles.map(async (file) => {
                const base64Data = await fileToBase64(file);
                return {
                    inlineData: {
                        mimeType: file.type,
                        data: base64Data
                    }
                };
            }));

            const extractionPrompt = `You are an expert contract analysis lawyer from Australia with a specialization in employment law. Your task is to meticulously review the provided employment contract(s). Analyze each document independently.

For each contract file provided, please identify and extract the following clauses: Parties, Term of Agreement, Position and Duties, Remuneration, Confidentiality, Intellectual Property, Termination, Limitation of Liability, Governing Law, and any non-compete or non-solicitation clauses.

For each clause you find, you must perform a risk assessment.
1.  Provide a simple summary in plain english.
2.  Provide the exact verbatim text from the document.
3.  Assign a 'riskLevel' of 'Low', 'Medium', or 'High'.
4.  Provide a concise 'riskExplanation' detailing why you've assigned that level, pointing out potential issues, ambiguities, or deviations from standard Australian employment law.

If a clause is not found, do not include it in the output. Present the output in the requested JSON format, ensuring the 'fileName' for each analysis corresponds to the original file.`;
            
            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    analysisResults: {
                        type: Type.ARRAY,
                        description: "An array of analysis for each contract provided.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                fileName: { type: Type.STRING, description: "The name of the analyzed file." },
                                clauses: {
                                    type: Type.ARRAY,
                                    description: "A list of important clauses extracted from the contract.",
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            clauseType: { type: Type.STRING, description: "The type of the clause (e.g., Termination, Confidentiality)." },
                                            summary: { type: Type.STRING, description: "A concise summary of the clause in plain English." },
                                            extractedText: { type: Type.STRING, description: "The verbatim text of the clause from the document." },
                                            riskLevel: { type: Type.STRING, description: "The assessed risk level of the clause (Low, Medium, or High)." },
                                            riskExplanation: { type: Type.STRING, description: "A brief explanation for the assigned risk level." }
                                        },
                                        required: ["clauseType", "summary", "extractedText", "riskLevel", "riskExplanation"]
                                    }
                                }
                            },
                            required: ["fileName", "clauses"]
                        }
                    }
                },
                required: ["analysisResults"]
            };

            const extractionResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [{ text: extractionPrompt }, ...fileParts] },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: responseSchema,
                }
            });

            const extractionResultJson = JSON.parse(extractionResponse.text);

            const analysisWithCompliance = await Promise.all(
                (extractionResultJson.analysisResults || []).map(async (contractAnalysis: any) => {
                    const clausesWithCompliance = await Promise.all(
                        (contractAnalysis.clauses || []).map(async (clause: any) => {
                            try {
                                const compliancePrompt = `You are an expert AI legal assistant specializing in Australian law. Perform a compliance check on the following contract clause. Use Google Search for the most current Australian legislation.
                        
                                Clause Text:
                                """
                                ${clause.extractedText}
                                """

                                Your analysis must:
                                1. Summarize if the clause appears compliant.
                                2. List potential compliance issues or risks, citing specific Australian laws or principles.
                                3. Suggest amendments for better compliance.
                                
                                Structure your response using simple Markdown (headings, bullets, bold text).`;
                        
                                const complianceResponse = await ai.models.generateContent({
                                    model: "gemini-2.5-flash",
                                    contents: compliancePrompt,
                                    config: { tools: [{ googleSearch: {} }] },
                                });

                                const complianceAnalysisText = complianceResponse.text;
                                const groundingData = complianceResponse.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
                                
                                const complianceSources = groundingData
                                    .filter(s => s.web?.uri && s.web.title)
                                    .map(s => ({ uri: s.web!.uri!, title: s.web!.title! }));

                                return {
                                    ...clause,
                                    complianceAnalysis: complianceAnalysisText,
                                    complianceSources: complianceSources,
                                };
                            } catch (complianceError) {
                                console.error(`Compliance check failed for clause "${clause.clauseType}":`, complianceError);
                                return {
                                    ...clause,
                                    complianceAnalysis: "An error occurred during the compliance check for this clause. Please try again.",
                                    complianceSources: [],
                                };
                            }
                        })
                    );
                    return { ...contractAnalysis, clauses: clausesWithCompliance };
                })
            );

            const finalResult: AnalysisResultData = {
                analysisResults: analysisWithCompliance.map((res: any, index: number) => ({
                    ...res,
                    fileName: pdfFiles[index]?.name || res.fileName
                }))
            };
            
            setAnalysisResult(finalResult);
            setFiles([]);

        } catch (e: any) {
            console.error("Analysis failed:", e);
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
        setAnalysisResult(null);
        setError(null);
        setFiles([]);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-10 bg-surface rounded-2xl shadow-sm border border-gray-200/80">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-mustard"></div>
                <h2 className="mt-6 text-xl font-semibold text-charcoal">Analyzing contract & checking compliance...</h2>
                <p className="mt-2 text-gray-500">This may take a few moments. Please don't close this page.</p>
            </div>
        );
    }
    
    if (analysisResult) {
        return <AnalysisResults results={analysisResult} onReset={handleReset} />;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-charcoal tracking-tight">Upload Your Contract</h1>
                <p className="mt-2 text-gray-500">
                    Upload documents (<strong className="font-semibold text-charcoal">PDF only</strong>) for automated analysis.
                </p>
            </div>
            
            {error && (
                <div className="p-4 my-4 text-sm text-red-800 bg-red-100 rounded-xl" role="alert">
                    <span className="font-bold">Analysis Failed:</span> {error}
                </div>
            )}

            <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`relative block w-full rounded-2xl border-2 ${isDragging ? 'border-mustard bg-amber-50' : 'border-dashed border-gray-300'} p-12 text-center transition-colors duration-200 ease-in-out bg-surface hover:border-mustard/80`}>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf"
                    className="sr-only"
                    onChange={handleFileSelect}
                />
                <div className="flex flex-col items-center">
                    <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <span className="mt-4 block text-sm font-semibold text-charcoal">
                        Drag & drop PDF files here
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                        or{' '}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="font-medium text-mustard hover:text-mustard/80 focus:outline-none focus:ring-2 focus:ring-mustard focus:ring-offset-2 rounded-sm"
                        >
                            browse your files
                        </button>
                    </span>
                    <p className="mt-4 text-xs text-gray-400">Supported format: PDF</p>
                </div>
            </div>

            {files.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-charcoal">Selected files</h2>
                    <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-surface">
                        {files.map(file => (
                            <li key={file.name + file.lastModified} className="flex items-center justify-between p-4 space-x-4">
                                <div className="flex items-center space-x-4 min-w-0">
                                    <FileIcon file={file} />
                                    <div className="font-medium text-sm min-w-0">
                                        <p className="text-charcoal truncate">{file.name}</p>
                                        <p className="text-gray-500">{formatBytes(file.size)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeFile(file.name)}
                                    className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50 flex-shrink-0"
                                    aria-label={`Remove ${file.name}`}
                                >
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-gray-200/80 gap-4">
                 <div className="text-sm text-gray-500">
                    Need help? Check out our <a href="#" className="font-medium text-charcoal hover:underline">Help Docs</a>, read the <a href="#" className="font-medium text-charcoal hover:underline">FAQs</a>, or <a href="#" className="font-medium text-charcoal hover:underline">Contact Support</a>.
                </div>
                <button
                    onClick={handleUploadAndAnalyze}
                    disabled={files.length === 0 || isLoading}
                    className="w-full sm:w-auto px-8 py-3.5 border border-transparent rounded-xl shadow-sm text-base font-semibold text-charcoal bg-mustard hover:bg-mustard/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mustard disabled:bg-amber-200 disabled:text-amber-700 disabled:cursor-not-allowed transition-all duration-300"
                >
                    {isLoading ? 'Analyzing...' : 'Upload and Analyze'}
                </button>
            </div>
        </div>
    );
};

export default ContractUploadPage;