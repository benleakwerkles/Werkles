module.exports = {
  apps: [
    {
      name: "brainstem",
      script: "./nervous_system/brainstem.js",
      cwd: "C:/tinkarden",
      autorestart: true,
      max_restarts: 10,
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "index",
      script: "./server/index.js",
      cwd: "C:/tinkarden",
      autorestart: true,
      max_restarts: 10,
      watch: false,
      env: {
        NODE_ENV: "production",
        TINKARDEN_API_HOST: "0.0.0.0",
        TINKARDEN_API_PORT: "3339"
      }
    },
    {
      name: "crawler",
      script: "./nervous_system/crawler.js",
      cwd: "C:/tinkarden",
      autorestart: true,
      max_restarts: 10,
      watch: false,
      env: {
        NODE_ENV: "production",
        CIRCULATION_DB: "C:/tinkarden/server/circulation.db",
        SPEAKER_QUEUE_DIR: "C:/tinkarden/intake/speaker_queue",
        RECEIPT_CRAWLER_INTERVAL_MS: "60000"
      }
    },
    {
      name: "ender_apoptosis",
      script: "./nervous_system/ender_apoptosis.js",
      args: "--daemon",
      cwd: "C:/tinkarden",
      autorestart: true,
      max_restarts: 10,
      watch: false,
      env: {
        NODE_ENV: "production",
        ENDER_CIRCULATION_DB: "C:/tinkarden/server/circulation.db",
        ENDER_QUARANTINE_LIST: "C:/tinkarden/nervous_system/quarantine_list.json",
        ENDER_FILTRATION_LOG: "C:/tinkarden/nervous_system/filtration_log.txt"
      }
    },
    {
      name: "daemon_watchdog",
      script: "./nervous_system/daemon_watchdog.js",
      cwd: "C:/tinkarden",
      autorestart: true,
      max_restarts: 10,
      watch: false,
      env: {
        NODE_ENV: "production",
        DAEMON_CORE_ORGANS: "brainstem,index,crawler,ender_apoptosis",
        DAEMON_WATCHDOG_INTERVAL_MS: "30000",
        DAEMON_MAX_UNSTABLE_RESTARTS: "3"
      }
    },
    {
      name: "speaker_keyring_provisioner",
      script: "C:/Program Files/Git/bin/bash.exe",
      args: "C:/speaker/bin/sync-keyrings.sh",
      cwd: "C:/speaker",
      autorestart: false,
      watch: false,
      env: {
        SPEAKER_ROOT: "C:/speaker",
        SPEAKER_ROOT_POSIX: "/c/speaker",
        GPG_BIN: "C:/Program Files/GnuPG/bin/gpg.exe"
      }
    }
  ]
};
