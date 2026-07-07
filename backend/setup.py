from setuptools import find_packages, setup

setup(
    name="deepshield-backend",
    version="0.1.0",
    description="DeepShield AI backend for deepfake detection, async tasks, and ML inference.",
    author="Abhishek Pathak",
    author_email="abhishek.pathak01111@gmail.com",
    packages=find_packages(exclude=["tests", "tests.*", "venv"]),
    include_package_data=True,
    python_requires=">=3.11", 
    install_requires=[
        # Web Framework
        "fastapi>=0.115.0",
        "uvicorn[standard]>=0.30.0",
        "python-multipart>=0.0.9",
        
        # Database
        "pymongo>=4.7.0",
        "motor>=3.4.0",
        
        # Cache & Queue
        "redis>=5.0.4",
        "celery>=5.4.0",
        
        # AWS S3
        "boto3>=1.34.0",
        
        # Auth & Security
        "python-jose[cryptography]>=3.3.0",
        "passlib[bcrypt]>=1.7.4",
        
        # Machine Learning & Deep Learning Core
        "torch>=2.3.0",
        "torchvision>=0.18.0",
        "torchaudio>=2.3.0",
        
        # Computer Vision
        "opencv-python>=4.10.0.84",
        "Pillow>=10.3.0",
        
        # NLP / Transformers
        "transformers>=4.41.0",
        "huggingface-hub>=0.23.0",
        
        # Data & Utilities
        "numpy>=1.26.4",
        "pydantic>=2.7.0",
        "pydantic-settings>=2.3.0",
        "python-dotenv>=1.0.1",
        "aiofiles>=23.2.1",
        
        # Logging & Monitoring
        "loguru>=0.7.2",
        "prometheus-client>=0.20.0"
    ],
    extras_require={
        "dev": [
            "pytest>=8.2.0",
            "pytest-asyncio>=0.23.0",
            "pytest-cov>=5.0.0",
            "httpx>=0.27.0",
            "fakeredis>=2.23.0"
        ]
    },
    entry_points={
        "console_scripts": [
            "deepshield-backend=app.main:app"
        ]
    },
    classifiers=[
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.11",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent"
    ],
    keywords="deepfake detection fastapi celery ml inference mongodb redis aws s3 pytorch transformers",
)