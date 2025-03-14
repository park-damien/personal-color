import streamlit as st
from PIL import Image
import numpy as np
from colorthief import ColorThief
import io
import os
from typing import List, Tuple

# 페이지 설정
st.set_page_config(
    page_title="이미지 색상 분석기",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 커스텀 CSS
st.markdown("""
<style>
    .main {
        padding: 2rem;
    }
    .color-box {
        padding: 1rem;
        border-radius: 4px;
        color: white;
        text-align: center;
        margin: 0.5rem 0;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
    }
</style>
""", unsafe_allow_html=True)

def rgb_to_hex(rgb: Tuple[int, int, int]) -> str:
    """RGB 값을 HEX 코드로 변환"""
    return '#{:02x}{:02x}{:02x}'.format(rgb[0], rgb[1], rgb[2])

def analyze_color_tone(rgb: Tuple[int, int, int]) -> str:
    """색상의 톤 분석 (웜톤/쿨톤)"""
    r, g, b = rgb
    
    # 웜톤 vs 쿨톤 분석
    warm_score = r * 0.8 + g * 0.2
    cool_score = b * 0.6 + g * 0.4
    
    if warm_score > cool_score:
        tone = '웜톤'
        if r > g + b:
            tone += ' (따뜻한 계열)'
        else:
            tone += ' (부드러운 계열)'
    else:
        tone = '쿨톤'
        if b > r + g:
            tone += ' (차가운 계열)'
        else:
            tone += ' (시원한 계열)'
    
    return tone

def generate_recommended_colors(base_color: Tuple[int, int, int]) -> List[Tuple[int, int, int]]:
    """추천 색상 생성"""
    r, g, b = base_color
    return [
        (r, min(g + 50, 255), min(b + 50, 255)),  # 밝은 톤
        (max(r - 30, 0), g, min(b + 30, 255)),    # 차분한 톤
        (min(r + 40, 255), max(g - 40, 0), b),    # 대비 톤
        (min(r + 20, 255), min(g + 20, 255), max(b - 40, 0)),  # 따뜻한 톤
        (max(r - 40, 0), min(g + 40, 255), min(b + 40, 255))   # 시원한 톤
    ]

def generate_color_combinations(colors: List[Tuple[int, int, int]]) -> List[dict]:
    """색상 조합 생성"""
    return [
        {
            'name': '모노톤 조합',
            'colors': [colors[0], colors[1]],
            'description': '차분하고 안정적인 느낌의 조합'
        },
        {
            'name': '삼색 조합',
            'colors': [colors[0], colors[2], colors[4]],
            'description': '생동감 있고 다채로운 느낌의 조합'
        },
        {
            'name': '그라데이션 조합',
            'colors': [colors[1], colors[0], colors[3]],
            'description': '부드럽게 이어지는 자연스러운 조합'
        }
    ]

def display_color_box(color: Tuple[int, int, int], label: str = None):
    """색상 박스 표시"""
    hex_color = rgb_to_hex(color)
    if label is None:
        label = hex_color
    st.markdown(
        f'<div class="color-box" style="background-color: {hex_color}">{label}</div>',
        unsafe_allow_html=True
    )

# 메인 레이아웃
st.title("이미지 색상 분석기")

# 2단 레이아웃 생성
col1, col2 = st.columns([1, 1.5])

with col1:
    st.subheader("이미지 업로드")
    uploaded_file = st.file_uploader("이미지를 선택하세요", type=['png', 'jpg', 'jpeg'])
    
    if uploaded_file:
        # 이미지 표시
        image = Image.open(uploaded_file)
        st.image(image, caption="업로드된 이미지", use_column_width=True)
        
        # 분석 버튼
        if st.button("색상 분석하기"):
            # 이미지를 바이트로 변환하여 ColorThief로 분석
            img_byte_arr = io.BytesIO()
            image.save(img_byte_arr, format=image.format)
            img_byte_arr = io.BytesIO(img_byte_arr.getvalue())
            
            try:
                color_thief = ColorThief(img_byte_arr)
                dominant_color = color_thief.get_color(quality=1)
                
                with col2:
                    st.subheader("분석 결과")
                    
                    # 대표 색상 표시
                    st.markdown("### 대표 색상")
                    display_color_box(dominant_color)
                    
                    # 톤 분석 결과 표시
                    st.markdown("### 색상 톤 분석")
                    tone = analyze_color_tone(dominant_color)
                    st.info(tone)
                    
                    # 추천 색상 표시
                    st.markdown("### 추천 색상 (5가지)")
                    recommended_colors = generate_recommended_colors(dominant_color)
                    for color in recommended_colors:
                        display_color_box(color)
                    
                    # 추천 색상 조합 표시
                    st.markdown("### 추천 색상 조합")
                    combinations = generate_color_combinations(recommended_colors)
                    for combo in combinations:
                        with st.expander(f"{combo['name']} - {combo['description']}"):
                            for color in combo['colors']:
                                display_color_box(color)
                            
            except Exception as e:
                st.error(f"색상 분석 중 오류가 발생했습니다: {str(e)}")
else:
    with col2:
        st.info("👈 왼쪽에서 이미지를 업로드하고 분석 버튼을 클릭하면 결과가 여기에 표시됩니다.") 