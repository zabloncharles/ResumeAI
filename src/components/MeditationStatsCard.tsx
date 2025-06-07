import React from "react";

interface MeditationStatsCardProps {
  gamesAndMeditation: number; // hours
  sessionCompletions: number; // count
  totalDuration: number; // minutes
}

const MeditationStatsCard: React.FC<MeditationStatsCardProps> = ({
  gamesAndMeditation,
  sessionCompletions,
  totalDuration,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        Meditation and exercise
      </h2>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="inline-block w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
              <span role="img" aria-label="ping-pong" className="text-xl">
                🏓
              </span>
            </span>
            <span className="text-base font-medium text-gray-700">
              Games and meditation
            </span>
          </div>
          <span className="text-xl font-bold text-gray-900">
            {gamesAndMeditation}{" "}
            <span className="text-sm font-normal text-gray-500">hours</span>
          </span>
        </div>
        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="inline-block w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span role="img" aria-label="medal" className="text-xl">
                🏅
              </span>
            </span>
            <span className="text-base font-medium text-gray-700">
              Session completions
            </span>
          </div>
          <span className="text-xl font-bold text-gray-900">
            {sessionCompletions}{" "}
            <span className="text-sm font-normal text-gray-500">Sessions</span>
          </span>
        </div>
        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="inline-block w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span role="img" aria-label="trophy" className="text-xl">
                🏆
              </span>
            </span>
            <span className="text-base font-medium text-gray-700">
              Total duration
            </span>
          </div>
          <span className="text-xl font-bold text-gray-900">
            {totalDuration}{" "}
            <span className="text-sm font-normal text-gray-500">min</span>
          </span>
        </div>
      </div>
      <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-lg transition">
        Check all Stats
      </button>
    </div>
  );
};

export default MeditationStatsCard;
