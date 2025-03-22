type ProgressCircleProps = {
  progress: number;
}

const ProgressCircle = ({ progress }: ProgressCircleProps) => (
  <div className="relative w-16 h-16 rounded-full bg-black border-4 border-gray-700 mr-4 flex items-center justify-center">
    <div className="absolute -rotate-90 w-16 h-16">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle 
          className="text-gray-700 stroke-current" 
          cx="50"
          cy="50"
          r="40"
          strokeWidth="10" 
          fill="transparent" 
        />
        <circle 
          className="text-green stroke-current" 
          cx="50"
          cy="50"
          r="40"
          strokeWidth="10" 
          strokeDasharray="251.2" 
          strokeDashoffset={progress} 
          fill="transparent" 
        />
      </svg>
    </div>
  </div>
);

export default ProgressCircle;