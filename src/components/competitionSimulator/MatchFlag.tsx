import { useGlobalStore } from "../../state/GlobalState";

const MatchFlag: React.FC<{ countryName: string, w: number, h: number, s: number }> = ({ countryName, w, h, s }) => {
  const getNationFlagCode = useGlobalStore(state => state.getNationFlagCode);
  const flagCode = getNationFlagCode(countryName);
  
  return (
    <div className={`relative w-${w} h-${h} overflow-hidden rounded flex items-center justify-center bg-gray-600`}>
      {flagCode && (
        <span
          className={`fi fi-${flagCode} absolute inset-0`}
          style={{
            fontSize: '1rem',
            lineHeight: '1',
            transform: `scale(${s})`,
          }}
        ></span>
      )}
    </div>
  );
};

export default MatchFlag;