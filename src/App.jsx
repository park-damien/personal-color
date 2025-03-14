import { useState, useRef, useCallback, useMemo } from 'react'
import ColorThief from 'colorthief'

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function App() {
  const [selectedImage, setSelectedImage] = useState(null)
  const [dominantColor, setDominantColor] = useState(null)
  const [recommendedColors, setRecommendedColors] = useState([])
  const [colorTone, setColorTone] = useState(null)
  const [colorCombinations, setColorCombinations] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const imageRef = useRef(null)

  const validateFile = (file) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error('지원하지 않는 파일 형식입니다. JPEG, PNG, GIF, WEBP 파일만 업로드 가능합니다.');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('파일 크기가 너무 큽니다. 최대 5MB까지 업로드 가능합니다.');
    }
    return true;
  }

  const handleImageUpload = useCallback((event) => {
    const file = event.target.files[0]
    if (!file) return;

    try {
      validateFile(file);
      setError(null);
      setIsLoading(true);
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target.result)
        setDominantColor(null)
        setRecommendedColors([])
        setColorTone(null)
        setColorCombinations([])
        setIsLoading(false)
      }
      reader.onerror = () => {
        throw new Error('파일을 읽는 중 오류가 발생했습니다.');
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  }, [])

  const generateRecommendedColors = useCallback((baseColor) => {
    const [r, g, b] = baseColor
    return [
      [r, Math.min(g + 50, 255), Math.min(b + 50, 255)], // 밝은 톤
      [Math.max(r - 30, 0), g, Math.min(b + 30, 255)], // 차분한 톤
      [Math.min(r + 40, 255), Math.max(g - 40, 0), b], // 대비 톤
      [Math.min(r + 20, 255), Math.min(g + 20, 255), Math.max(b - 40, 0)], // 따뜻한 톤
      [Math.max(r - 40, 0), Math.min(g + 40, 255), Math.min(b + 40, 255)], // 시원한 톤
    ]
  }, [])

  const analyzeColorTone = useCallback((color) => {
    const [r, g, b] = color
    const warmScore = r * 0.8 + g * 0.2
    const coolScore = b * 0.6 + g * 0.4
    
    let tone = ''
    if (warmScore > coolScore) {
      tone = '웜톤'
      if (r > g + b) {
        tone += ' (따뜻한 계열)'
      } else {
        tone += ' (부드러운 계열)'
      }
    } else {
      tone = '쿨톤'
      if (b > r + g) {
        tone += ' (차가운 계열)'
      } else {
        tone += ' (시원한 계열)'
      }
    }
    
    return tone
  }, [])

  const generateColorCombinations = useCallback((colors) => {
    return [
      {
        name: '모노톤 조합',
        colors: [colors[0], colors[1]],
        description: '차분하고 안정적인 느낌의 조합'
      },
      {
        name: '삼색 조합',
        colors: [colors[0], colors[2], colors[4]],
        description: '생동감 있고 다채로운 느낌의 조합'
      },
      {
        name: '그라데이션 조합',
        colors: [colors[1], colors[0], colors[3]],
        description: '부드럽게 이어지는 자연스러운 조합'
      }
    ]
  }, [])

  const analyzeImage = useCallback(() => {
    if (!imageRef.current?.complete) return;

    setIsLoading(true);
    setError(null);

    try {
      const colorThief = new ColorThief()
      const color = colorThief.getColor(imageRef.current)
      setDominantColor(color)
      
      const recommendations = generateRecommendedColors(color)
      setRecommendedColors(recommendations)
      
      const tone = analyzeColorTone(color)
      setColorTone(tone)
      
      const combinations = generateColorCombinations(recommendations)
      setColorCombinations(combinations)
    } catch (error) {
      setError('이미지 분석 중 오류가 발생했습니다. 다른 이미지를 시도해보세요.');
      console.error('색상 추출 중 오류 발생:', error)
    } finally {
      setIsLoading(false);
    }
  }, [generateRecommendedColors, analyzeColorTone, generateColorCombinations])

  const rgbToHex = useCallback((r, g, b) => 
    '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join(''), [])

  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text)
      .then(() => alert('색상 코드가 클립보드에 복사되었습니다.'))
      .catch(() => alert('클립보드 복사에 실패했습니다.'))
  }, [])

  const renderColorBox = useCallback((color, index) => {
    const hexColor = rgbToHex(...color)
    return (
      <div
        key={index}
        className="color-box"
        style={{ backgroundColor: hexColor }}
        onClick={() => copyToClipboard(hexColor)}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => e.key === 'Enter' && copyToClipboard(hexColor)}
        aria-label={`${hexColor} 색상 코드 복사하기`}
      >
        {hexColor}
      </div>
    )
  }, [rgbToHex, copyToClipboard])

  return (
    <div className="container" style={{
      display: 'flex',
      gap: '2rem',
      maxWidth: '1200px',
      margin: '2rem auto',
      padding: '2rem',
      minHeight: '90vh'
    }}>
      {/* 좌측: 입력 영역 */}
      <div className="input-section" style={{
        flex: '0 0 40%',
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        height: 'fit-content'
      }}>
        <h1 style={{ marginBottom: '2rem' }}>이미지 색상 추천</h1>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ marginBottom: '1rem' }}
          aria-label="이미지 파일 선택"
        />
        {error && (
          <div role="alert" style={{ color: 'red', marginTop: '1rem' }}>
            {error}
          </div>
        )}
        {selectedImage && (
          <div>
            <img
              ref={imageRef}
              src={selectedImage}
              alt="업로드된 이미지"
              style={{
                width: '100%',
                borderRadius: '4px',
                marginBottom: '1rem'
              }}
              crossOrigin="anonymous"
              onLoad={() => setSelectedImage(selectedImage)}
            />
            <button 
              onClick={analyzeImage}
              className="analyze-button"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 20px',
                fontSize: '16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
            >
              {isLoading ? '분석 중...' : '색상 분석하기'}
            </button>
          </div>
        )}
      </div>

      {/* 우측: 결과 영역 */}
      <div className="results-section" style={{
        flex: '1',
        display: isLoading ? 'flex' : (dominantColor ? 'block' : 'flex'),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        overflowY: 'auto',
        maxHeight: '90vh'
      }}>
        {isLoading && (
          <div className="loading" role="status">
            <span className="sr-only">로딩 중...</span>
          </div>
        )}
        
        {!isLoading && !dominantColor && (
          <div style={{
            textAlign: 'center',
            color: '#666',
            fontSize: '1.1rem'
          }}>
            이미지를 업로드하고 분석 버튼을 클릭하면<br />
            색상 분석 결과가 이 곳에 표시됩니다.
          </div>
        )}
        
        {dominantColor && (
          <>
            <h2>대표 색상</h2>
            <div className="colors-section" style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              {renderColorBox(dominantColor, 0)}
            </div>

            {colorTone && (
              <div style={{ marginBottom: '2rem' }}>
                <h2>색상 톤 분석</h2>
                <p style={{ 
                  fontSize: '1.2rem', 
                  backgroundColor: '#f8f8f8',
                  padding: '1rem',
                  borderRadius: '4px',
                  marginTop: '0.5rem'
                }}>
                  {colorTone}
                </p>
              </div>
            )}

            <h2>추천 색상 (5가지)</h2>
            <div className="colors-section" style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '2rem',
              flexWrap: 'wrap'
            }}>
              {recommendedColors.map((color, index) => renderColorBox(color, index))}
            </div>

            <h2>추천 색상 조합</h2>
            <div style={{ marginTop: '1rem' }}>
              {colorCombinations.map((combo, index) => (
                <div key={index} style={{
                  marginBottom: '2rem',
                  backgroundColor: '#f8f8f8',
                  padding: '1.5rem',
                  borderRadius: '8px'
                }}>
                  <h3 style={{ marginBottom: '0.5rem' }}>{combo.name}</h3>
                  <p style={{ marginBottom: '1rem', color: '#666' }}>{combo.description}</p>
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    justifyContent: 'center'
                  }}>
                    {combo.colors.map((color, colorIndex) => renderColorBox(color, colorIndex))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default App 