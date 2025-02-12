import React, { useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
const API_TOKEN = process.env.REACT_APP_HF_TOKEN; // Load from env

function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset states
    setSelectedImage(URL.createObjectURL(file));
    setLoading(true);
    setError(null);
    setPredictions([]);

    try {
      // Convert image to base64
      const base64Image = await fileToBase64(file);
      
      // Log the file details for debugging
      console.log('File type:', file.type);
      console.log('File size:', file.size);

      // Make API request to Hugging Face
      const response = await fetch(
        "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: base64Image,
            options: {
              wait_for_model: true,
              use_cache: false
            }
          }),
        }
      );

      // Log the response status and headers for debugging
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.text();
        console.log('Error response:', errorData);
        throw new Error(`API Error (${response.status}): ${errorData}`);
      }

      const result = await response.json();
      console.log('API Response:', result);

      // This model returns a text description instead of classifications
      if (typeof result[0] === 'string') {
        setPredictions([{
          label: 'Image Description',
          score: 1.0,
          description: result[0]
        }]);
      } else {
        throw new Error('Unexpected response format from API');
      }
    } catch (error) {
      console.error("Error details:", error);
      setError(
        error instanceof Error 
          ? `Failed to analyze image: ${error.message}` 
          : 'Failed to analyze image. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Image Analysis</h1>
          
          {/* Upload Section */}
          <div className="mb-6">
            <label 
              htmlFor="image-upload" 
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PNG, JPG or JPEG (max 5MB)</p>
              </div>
              <input 
                id="image-upload" 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
          </div>

          {/* Preview Section */}
          {selectedImage && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2 text-gray-700">Preview</h2>
              <div className="relative">
                <img 
                  src={selectedImage} 
                  alt="Preview" 
                  className="w-full h-64 object-cover rounded-lg"
                />
                {loading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}

          {/* Results Section */}
          {predictions.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-2 text-gray-700">Analysis Results</h2>
              <div className="space-y-2">
                {predictions.map((pred, index) => (
                  <div 
                    key={index}
                    className="p-3 bg-gray-50 rounded-lg"
                  >
                    <p className="text-gray-700 whitespace-pre-wrap">{pred.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;