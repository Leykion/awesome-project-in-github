// scripts/github/rate-limiter.ts
// API 速率限制管理：REST 5000/hr, Search 30/min, GraphQL 5000 points/hr

/** API 端点类型 */
type ApiEndpoint = "rest" | "search" | "graphql";

/** 速率限制状态 */
interface RateLimitState {
  /** 剩余配额 */
  remaining: number;
  /** 配额上限 */
  limit: number;
  /** 重置时间（Unix 秒） */
  resetAt: number;
}

/** 速率限制管理器，追踪剩余配额并在接近限制时自动延迟 */
export class RateLimiter {
  private state: Record<ApiEndpoint, RateLimitState> = {
    rest: { remaining: 5000, limit: 5000, resetAt: 0 },
    search: { remaining: 30, limit: 30, resetAt: 0 },
    graphql: { remaining: 5000, limit: 5000, resetAt: 0 },
  };

  /** 安全阈值：剩余配额低于此数量时触发等待 */
  private readonly safetyMinimum: Record<ApiEndpoint, number> = {
    rest: 100, // 留 100 次给其他阶段
    search: 3,
    graphql: 200,
  };

  /**
   * 从响应头更新速率限制状态
   * @param endpoint - API 端点类型
   * @param headers - HTTP 响应头
   */
  updateFromHeaders(endpoint: ApiEndpoint, headers: Headers): void {
    const remaining = headers.get("x-ratelimit-remaining");
    const limit = headers.get("x-ratelimit-limit");
    const reset = headers.get("x-ratelimit-reset");

    if (remaining !== null) {
      this.state[endpoint].remaining = Number.parseInt(remaining, 10);
    }
    if (limit !== null) {
      this.state[endpoint].limit = Number.parseInt(limit, 10);
    }
    if (reset !== null) {
      this.state[endpoint].resetAt = Number.parseInt(reset, 10);
    }
  }

  /**
   * 请求前检查配额，必要时等待至重置时间
   * @param endpoint - API 端点类型
   */
  async waitIfNeeded(endpoint: ApiEndpoint): Promise<void> {
    const state = this.state[endpoint];
    const threshold = this.safetyMinimum[endpoint];

    if (state.remaining <= threshold && state.resetAt > 0) {
      const nowSec = Math.floor(Date.now() / 1000);
      const waitSec = state.resetAt - nowSec + 1; // 额外 1 秒缓冲

      if (waitSec > 0) {
        console.warn(
          `[RateLimiter] ${endpoint} 配额不足 (${state.remaining}/${state.limit})，等待 ${waitSec} 秒...`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitSec * 1000));
        // 重置后恢复默认配额
        state.remaining = state.limit;
      }
    }
  }

  /**
   * 获取指定端点的剩余配额
   * @param endpoint - API 端点类型
   */
  getRemaining(endpoint: ApiEndpoint): number {
    return this.state[endpoint].remaining;
  }

  /**
   * 获取指定端点的完整状态
   * @param endpoint - API 端点类型
   */
  getState(endpoint: ApiEndpoint): Readonly<RateLimitState> {
    return { ...this.state[endpoint] };
  }

  /**
   * 手动消耗一个配额（用于非 HTTP 方式的计数）
   * @param endpoint - API 端点类型
   */
  consume(endpoint: ApiEndpoint): void {
    if (this.state[endpoint].remaining > 0) {
      this.state[endpoint].remaining--;
    }
  }
}
