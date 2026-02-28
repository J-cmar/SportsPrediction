'use client';

import { useState, useEffect } from 'react';

export default function PopularBets() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [popularData, setPopularData] = useState({
    sport: 'Football',
    team: 'Kansas City Chiefs',
    player: 'Patrick Mahomes',
    totalBets: 0,
    usingMockData: true
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch popular bets data from API
  useEffect(() => {
    const fetchPopularBets = async () => {
      try {
        const response = await fetch('/api/popular-bets');
        const result = await response.json();
        
        if (result.success && result.data) {
          setPopularData(result.data);
        }
      } catch (error) {
        console.error('Error fetching popular bets:', error);
        // Keep using default mock data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchPopularBets();
  }, []);

  const slides = [
    {
      title: 'Most Popular Sport',
      value: popularData.sport,
      icon: '🏈',
      color: 'bg-blue-600',
      borderColor: 'border-blue-500'
    },
    {
      title: 'Most Popular Team',
      value: popularData.team,
      icon: '🏆',
      color: 'bg-purple-600',
      borderColor: 'border-purple-500'
    },
    {
      title: 'Most Popular Player',
      value: popularData.player,
      icon: '⭐',
      color: 'bg-orange-600',
      borderColor: 'border-orange-500'
    }
  ];

  const nextSlide = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setCurrentSlide((prev) => (prev + 1) % slides.length);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const prevSlide = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const goToSlide = (index) => {
    if (!isAnimating && index !== currentSlide) {
      setIsAnimating(true);
      setCurrentSlide(index);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  // Auto-rotate carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentSlide, isAnimating]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          Popular Bets
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
          See what the community is betting on right now
        </p>
        {!isLoading && (
          <div className="mt-4 inline-flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
            <span className="text-gray-400 text-sm">
              {popularData.usingMockData 
                ? '📊 Showing sample data (no bets yet)'
                : `📊 Based on ${popularData.totalBets} bet${popularData.totalBets !== 1 ? 's' : ''}`
              }
            </span>
          </div>
        )}
      </div>

      {/* Carousel Container */}
      <div className="max-w-4xl mx-auto">
        {isLoading ? (
          // Loading skeleton
          <div className="relative bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden h-96 md:h-[500px] flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
              <p className="text-gray-400">Loading popular bets...</p>
            </div>
          </div>
        ) : (
          <div className="relative bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
          {/* Slides */}
          <div className="relative h-96 md:h-[500px]">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                  index === currentSlide
                    ? 'opacity-100 translate-x-0'
                    : index < currentSlide
                    ? 'opacity-0 -translate-x-full'
                    : 'opacity-0 translate-x-full'
                }`}
              >
                <div className="h-full bg-gray-900 flex flex-col items-center justify-center p-8">
                  {/* Icon */}
                  <div className="text-7xl md:text-8xl mb-6">
                    {slide.icon}
                  </div>

                  {/* Title */}
                  <h2 className="text-xl md:text-2xl font-medium text-gray-400 mb-6 uppercase tracking-wide">
                    {slide.title}
                  </h2>

                  {/* Value */}
                  <div className={`${slide.color} rounded-lg px-8 py-5 border-2 ${slide.borderColor}`}>
                    <p className="text-2xl md:text-4xl font-bold text-white text-center">
                      {slide.value}
                    </p>
                  </div>

                  {/* Stats Badge */}
                  <div className="mt-8 bg-gray-800 rounded-md px-5 py-2 border border-gray-700">
                    <p className="text-gray-300 text-sm font-medium">
                      🔥 Trending Now
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg p-2 transition-colors border border-gray-700"
            aria-label="Previous slide"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg p-2 transition-colors border border-gray-700"
            aria-label="Next slide"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dot Indicators */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentSlide
                    ? 'w-8 h-2 bg-white'
                    : 'w-2 h-2 bg-gray-600 hover:bg-gray-500'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
        )}

        {/* Info Cards Below Carousel */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {slides.map((slide, index) => (
              <div
                key={index}
                onClick={() => goToSlide(index)}
                className={`cursor-pointer bg-gray-800 rounded-lg p-5 border transition-all duration-200 hover:bg-gray-750 ${
                  index === currentSlide
                    ? 'border-gray-600'
                    : 'border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{slide.icon}</div>
                  <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{slide.title}</p>
                    <p className="text-white font-semibold text-base mt-1">{slide.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}