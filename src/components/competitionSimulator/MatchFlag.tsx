import { useGlobalStore } from "../../state/GlobalState";

const MatchFlag: React.FC<{ countryName: string }> = ({ countryName }) => {
  const getNationFlagCode = useGlobalStore(state => state.getNationFlagCode);
  const flagCode = getNationFlagCode(countryName);
  
  return (
    <div className="relative w-7 h-5 overflow-hidden rounded flex items-center justify-center bg-gray-600">
      {flagCode && (
        <span
          className={`fi fi-${flagCode} absolute inset-0`}
          style={{
            fontSize: '1rem',
            lineHeight: '1',
            transform: 'scale(1.5)',
          }}
        ></span>
      )}
    </div>
  );
};

export default MatchFlag;