from app.main import app

# Vercel's Python runtime looks for a module-level ASGI/WSGI app named `app`.
# With Root Directory set to "backend" in Vercel project settings, the `app`
# package (backend/app/) is importable directly with no path manipulation.
