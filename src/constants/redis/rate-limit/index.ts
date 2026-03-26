export const RATE_LIMIT_CONFIG = {
  LOGIN: {
    PASSWORD: {
      PER_IP: {
        MAX_REQUESTS: 30,
        WINDOW_SECONDS: 900
      }
    },
    OTP: {
      PER_IP: {
        MAX_REQUESTS: 10,
        WINDOW_SECONDS: 900
      },
      PER_EMAIL: {
        MAX_REQUESTS: 5,
        WINDOW_SECONDS: 900
      }
    },
    MAGIC_LINK: {
      PER_IP: {
        MAX_REQUESTS: 10,
        WINDOW_SECONDS: 900
      },
      PER_EMAIL: {
        MAX_REQUESTS: 5,
        WINDOW_SECONDS: 900
      }
    }
  },

  SIGNUP: {
    SEND_OTP: {
      PER_IP: {
        MAX_REQUESTS: 5,
        WINDOW_SECONDS: 900
      },
      PER_EMAIL: {
        MAX_REQUESTS: 3,
        WINDOW_SECONDS: 900
      }
    },
    CHECK_EMAIL: {
      PER_IP: {
        MAX_REQUESTS: 10,
        WINDOW_SECONDS: 60
      }
    }
  },

  FORGOT_PASSWORD: {
    OTP: {
      PER_IP: {
        MAX_REQUESTS: 10,
        WINDOW_SECONDS: 900
      },
      PER_EMAIL: {
        MAX_REQUESTS: 5,
        WINDOW_SECONDS: 900
      }
    },
    MAGIC_LINK: {
      PER_IP: {
        MAX_REQUESTS: 10,
        WINDOW_SECONDS: 900
      },
      PER_EMAIL: {
        MAX_REQUESTS: 5,
        WINDOW_SECONDS: 900
      }
    },
    RESET: {
      PER_IP: {
        MAX_REQUESTS: 10,
        WINDOW_SECONDS: 900
      }
    }
  },

  CONTACT: {
    SUBMIT: {
      PER_IP: {
        MAX_REQUESTS: 5,
        WINDOW_SECONDS: 900
      }
    }
  },

  USER: {
    UPDATE_PROFILE: {
      PER_IP: {
        MAX_REQUESTS: 10,
        WINDOW_SECONDS: 900
      }
    },
    UPLOAD_AVATAR: {
      PER_IP: {
        MAX_REQUESTS: 5,
        WINDOW_SECONDS: 900
      }
    }
  }
} as const;
