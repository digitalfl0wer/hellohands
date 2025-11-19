#!/bin/bash
# ASLLVD Pipeline Runner
# Loads environment variables from .env.local and runs ASLLVD commands

set -e  # Exit on any error

echo "🚀 Loading ASLLVD environment..."

# Load environment variables from .env.local
set -a
source .env.local
set +a

echo "✓ Environment loaded"
echo "✓ ASLLVD_COOKIE: ${ASLLVD_COOKIE:0:10}..."

# Export for subprocesses
export ASLLVD_COOKIE
export DATASET
export DATA_ROOT

echo ""
echo "Available commands:"
echo "  ./run_asllvd.sh generate-manifest - Generate manifest with 50 glosses"
echo "  ./run_asllvd.sh discover-urls     - Discover real video URLs from DAI"
echo "  ./run_asllvd.sh ingest            - Download raw videos (HTML pages)"
echo "  ./run_asllvd.sh extract-video-urls - Extract real video URLs from HTML"
echo "  ./run_asllvd.sh normalize         - Process videos (trim/fps/posters)"
echo "  ./run_asllvd.sh build             - Generate labels and packs"
echo "  ./run_asllvd.sh verify            - Check coverage"
echo "  ./run_asllvd.sh all               - Run complete pipeline"
echo ""

# Check command argument
case "${1:-help}" in
    "ingest")
        echo "📥 Running ASLLVD ingest..."
        goose run --recipe goose/recipes/asllvd_ingest.yaml
        ;;
    "normalize")
        echo "🎬 Running ASLLVD normalize..."
        goose run --recipe goose/recipes/asllvd_normalize.yaml
        ;;
    "build")
        echo "🏗️  Running ASLLVD build..."
        pnpm asllvd:build-complete
        ;;
    "verify")
        echo "✅ Running ASLLVD verify..."
        pnpm asllvd:coverage
        ;;
    "all")
        echo "🎯 Running complete ASLLVD pipeline..."
        ./run_asllvd.sh generate-manifest
        ./run_asllvd.sh ingest
        ./run_asllvd.sh normalize
        ./run_asllvd.sh build
        ./run_asllvd.sh verify
        ;;
    "generate-manifest")
        echo "📋 Generating ASLLVD manifest..."
        pnpm asllvd:generate-manifest
        ;;
    "discover-urls")
        echo "🔍 Discovering ASLLVD video URLs..."
        pnpm asllvd:discover-urls
        ;;
    "extract-video-urls")
        echo "🎬 Extracting real video URLs from downloaded HTML..."
        pnpm asllvd:extract-video-urls
        ;;
    "help"|*)
        echo "Usage: $0 <command>"
        echo ""
        echo "Commands:"
        echo "  ingest          - Download raw videos from manifest"
        echo "  normalize       - Process videos (trim, fps, posters)"
        echo "  build           - Generate labels and pack definitions"
        echo "  verify          - Check coverage requirements"
        echo "  all             - Run complete pipeline (generate → ingest → normalize → build → verify)"
        echo "  generate-manifest - Generate manifest from gloss config"
        echo "  help            - Show this help"
        ;;
esac
