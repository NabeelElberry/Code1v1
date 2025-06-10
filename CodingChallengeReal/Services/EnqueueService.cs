using System.Numerics;
using StackExchange.Redis;

namespace CodingChallengeReal.Services
{
    public class EnqueueService
    {
        private readonly IDatabase _redis;
        private readonly int _bucketSize = 100;
        private string redisConnection = "localhost";
        public EnqueueService(IConnectionMultiplexer connectionMultiplexer ) {    
            _redis = connectionMultiplexer.GetDatabase();
        }

        public (int, int) EnqueuePlayer(string playerId, double elo)
        {
            (int, int) min_max = EloHelper.GetBucketRange(elo);
            string queueKey = EloHelper.GetBucketKey(elo);
            _redis.ListRightPush(queueKey, playerId);
            Console.WriteLine($"Enqueued {playerId} into {queueKey}");
            return min_max;
        }

        public async Task<RedisValue?> AttemptMatchPlayer(int minBucket, int maxBucket, string playerId)
        {


            bool matchFound = false;
            var key = $"elo_queue_{minBucket}_{maxBucket}";

            var startTime = DateTime.UtcNow;
            // while we haven't found a match, and we haven't exceeded 10 seconds in the same bucket, keep searching 
            while (!matchFound && startTime.AddSeconds(10) > DateTime.UtcNow) 
            {
       
                _redis.ListRemove(key, playerId); // remove so player can't match with themselvs
                var opponent = _redis.ListRightPop(key); // opponent popped
                var player = (RedisValue) playerId;
                
                matchFound = opponent.HasValue;

                if (opponent.HasValue)
                {
                    matchFound = true;
                    return opponent;
                }
            }
            _redis.ListRightPush(key, playerId);
            // no match was found
            return null;
        }

    }
}
