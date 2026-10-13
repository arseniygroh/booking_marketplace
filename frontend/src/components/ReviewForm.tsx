import { useState } from 'react';
import getCookie from '@/cookies';

interface ReviewFormProps {
    bookingId: number;
    propertyTitle: string;
    onSuccess?: () => void;
}

export default function ReviewForm({bookingId, propertyTitle, onSuccess}: ReviewFormProps) {
    const [rating, setRating] = useState<number>(0);
    const [hoveredRating, setHoveredRating] = useState<number>(0);
    const [comment, setComment] = useState<string>('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (rating === 0) {
            setErrorMessage("Please select a star rating.");
            setStatus('error');
            return;
        }
        setStatus('loading');
        
        try {
            const csrfToken = getCookie('csrftoken') || '';
            const response = await fetch(`http://localhost:8000/bookings/${bookingId}/review/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "credentials": "include",
                    "X-CSRFToken": csrfToken,
                },
                body: JSON.stringify({rating, comment}),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Failed to submit review');

            setStatus('success');
            if (onSuccess) onSuccess();
            
        } catch (error: any) {
            setErrorMessage(error.message);
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <h4 className="text-lg font-bold text-green-800 mb-1">Review Submitted!</h4>
                <p className="text-green-700 text-sm">Thank you for sharing your experience at {propertyTitle}.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Rate your stay</h3>
            <p className="text-gray-500 text-sm mb-6">How was your experience at {propertyTitle}?</p>
            <div className="flex gap-1 mb-6" onMouseLeave={() => setHoveredRating(0)}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                    >
                        <svg 
                            className={`w-10 h-10 transition-colors ${
                                (hoveredRating || rating) >= star ? 'text-amber-500' : 'text-gray-300'
                            }`} 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                        >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                        </svg>
                    </button>
                ))}
            </div>
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Write a public review (Optional)
                </label>
                <textarea
                    rows={4}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Tell future guests what you loved about this place..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none resize-none"
                />
            </div>
            {status === 'error' && (
                <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
                    {errorMessage}
                </div>
            )}
            <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {status === 'loading' ? 'Submitting...' : 'Submit Review'}
            </button>
        </form>
    );
}