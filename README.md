# 이미지 색상 분석기

이미지에서 대표 색상을 추출하고 어울리는 색상을 추천해주는 웹 애플리케이션입니다.

## 주요 기능

- 이미지 업로드 및 분석
- 대표 색상 추출
- 웜톤/쿨톤 분석
- 5가지 추천 색상 생성
- 색상 조합 추천 (모노톤, 삼색, 그라데이션)

## 설치 방법

1. 저장소 클론
```bash
git clone https://github.com/[사용자명]/image-color-analyzer.git
cd image-color-analyzer
```

2. 필요한 패키지 설치
```bash
pip install -r requirements.txt
```

## 실행 방법

```bash
streamlit run app.py
```

## 기술 스택

- Python
- Streamlit
- Pillow
- ColorThief
- NumPy

## 라이선스

MIT License

## 작성자

[사용자명] 