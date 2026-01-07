import { useState, useRef, useEffect } from 'react'
import { useGlobalStore } from '../../state/GlobalState'

interface NationAutocompleteProps {
  onNationSelect: (nation: string) => void
  placeholder?: string
  initialValue?: string
}

const NationAutocomplete: React.FC<NationAutocompleteProps> = ({ 
  onNationSelect, 
  placeholder = "Enter country name...",
  initialValue = ''
}) => {
  const [inputValue, setInputValue] = useState(initialValue)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const { getAllNationalities } = useGlobalStore()
  const allNations = getAllNationalities()

  const filteredNations = allNations.filter(nation =>
    nation.toLowerCase().includes(inputValue.toLowerCase())
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    setIsOpen(true)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredNations.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredNations.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < filteredNations.length) {
          selectNation(filteredNations[selectedIndex])
        } else if (filteredNations.length === 1) {
          selectNation(filteredNations[0])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  const selectNation = (nation: string) => {
    setInputValue(nation)
    setIsOpen(false)
    setSelectedIndex(-1)
    onNationSelect(nation)
  }

  // Update input value when initialValue changes
  useEffect(() => {
    setInputValue(initialValue)
  }, [initialValue])

  const handleBlur = () => {
    // Delay closing to allow click on dropdown items
    setTimeout(() => {
      setIsOpen(false)
      setSelectedIndex(-1)
    }, 200)
  }

  const handleClick = () => {
    setIsOpen(true)
  }

  useEffect(() => {
    if (selectedIndex >= 0) {
      const element = document.getElementById(`nation-${selectedIndex}`)
      if (element) {
        element.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onClick={handleClick}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-colors"
      />
      
      {isOpen && filteredNations.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredNations.map((nation, index) => (
            <div
              key={nation}
              id={`nation-${index}`}
              className={`px-4 py-3 cursor-pointer transition-colors ${
                index === selectedIndex
                  ? 'bg-gray-700 text-green-400'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
              onClick={() => selectNation(nation)}
            >
              {nation}
            </div>
          ))}
        </div>
      )}
      
      {isOpen && inputValue && filteredNations.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
          <div className="px-4 py-3 text-gray-400">
            No countries found matching "{inputValue}"
          </div>
        </div>
      )}
    </div>
  )
}

export default NationAutocomplete
