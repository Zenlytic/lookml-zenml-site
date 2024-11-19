'use client';
import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import yaml from 'js-yaml';


interface ConversionError {
  message: string;
  details?: string;
  timestamp: string;
}

const TextConverter = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ConversionError | null>(null);

  const handleConvert = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      
      const response = await fetch('https://pblankley--lookml-zenml-api.modal.run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input_text: inputText })
      });

      const data = await response.text();
      const parsedData = yaml.load(data);
      let formattedData = yaml.dump(parsedData, {
        indent: 0,
        lineWidth: -1,
        noRefs: true,
        flowLevel: -1
      });
      
      // Remove the | and de-indent if present
      formattedData = formattedData.replace(/^\|\n/, '').replace(/^\s{2}/gm, '');


      if (!response.ok) {
        throw new Error(`API Error (${response.status}): ${data}`);
      }

      setOutputText(formattedData);
      setError(null);
    } catch (err) {
      const error = err as Error;
      setError({
        message: error.message,
        details: error.stack,
        timestamp: new Date().toISOString()
      });
      setOutputText(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow p-4">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter your LookML View here..."
              className="w-full h-[80vh] p-4 border border-gray-200 rounded-lg resize-none font-mono text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-w-[140ch]"
            />
          </div>
          {/* Output Section */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="relative h-96">
              {error ? (
                <div className="absolute inset-0 p-4 bg-red-50 rounded-lg overflow-auto">
                  <div className="flex items-start space-x-2 text-red-600 mb-2">
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold">Error Occurred</h3>
                      <p className="text-sm">{error.message}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <textarea
                value={outputText}
                readOnly
                placeholder="ZenML file yaml will appear here..."
                className={`w-full h-[80vh] p-4 border border-gray-200 rounded-lg resize-none font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-w-[140ch] ${
                  error ? 'text-red-600' : 'text-black'
                }`}
              />
              )}
            </div>
          </div>

          {/* Convert Button */}
          <div className="md:col-span-2 flex justify-center">
            <button
              onClick={handleConvert}
              disabled={isLoading}
              className={`px-6 py-3 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Converting...' : 'Convert'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextConverter;
