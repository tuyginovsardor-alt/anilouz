anilo.uz {
    # Root for the static files (frontend dist)
    root * /root/anilouz/dist
    
    # Static file server for the frontend
    file_server

    # Serve videos and images from the storage directory
    handle_path /storage/* {
        root * /root/anilouz/storage
        file_server
    }

    # Reverse proxy for API requests to the backend
    handle /api/* {
        reverse_proxy localhost:8000
    }

    # Fallback to index.html for SPA routing
    handle {
        try_files {path} /index.html
    }

    # Error handling
    handle_errors {
        rewrite * /{err.status_code}.html
        file_server
    }

    # Performance: Enable compression
    encode zstd gzip

    # Logging
    log {
        output file /var/log/caddy/access.log
    }
}
