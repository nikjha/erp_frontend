import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Read straight from package.json rather than process.env.npm_package_version,
// which is only populated when vite is launched through an npm script.
const { version } = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'),
) as { version: string }

/**
 * Build stamp shown in the app footer.
 *
 * Version comes from package.json so there is one place to bump it. The
 * commit is read at build time and is optional on purpose: a checkout
 * without git (a source tarball, a Docker build that copies files rather
 * than cloning) must still build, so a failure here degrades to "local"
 * instead of breaking the build.
 */
function gitCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'local'
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __GIT_COMMIT__: JSON.stringify(process.env.GIT_COMMIT ?? gitCommit()),
    __BUILD_MODE__: JSON.stringify(mode),
  },
}))
