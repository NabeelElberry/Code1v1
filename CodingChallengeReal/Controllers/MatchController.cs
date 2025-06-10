using AutoMapper;
using CodingChallengeReal.Domains;
using CodingChallengeReal.DTO;
using CodingChallengeReal.Repositories.Implementation;
using CodingChallengeReal.Repositories.Interface;
using CodingChallengeReal.Services;
using Microsoft.AspNetCore.Mvc;
using StackExchange.Redis;

namespace CodingChallengeReal.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class MatchController : Controller
    {
        private readonly EnqueueService _enqueueService;
        private readonly IMatchRepository _matchRepository;
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;

        public MatchController(IMatchRepository matchRepository, IMapper mapper, IUserRepository userRepository, EnqueueService enqueueService)
        {
            _enqueueService = enqueueService;
            _matchRepository = matchRepository;
            _userRepository = userRepository;
            _mapper = mapper;
        }


        [HttpPost]
        public async Task<IActionResult> AddMatchAsync(AddMatchDTO addMatchRequest)
        {
            Match match = _mapper.Map<Match>(addMatchRequest);
            match.id = Guid.NewGuid().ToString();
            match.sk = "meta";
            await _matchRepository.AddAsync(match);

            return Ok(match);
        }

        [HttpGet]
        public async Task<IActionResult> GetMatchAsync(Guid id)
        {
            var matchDTO = await _matchRepository.GetAsync(id);
            return Ok(matchDTO);
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteMatchAsync(Guid id)
        {
            var deletedUserBool = await _matchRepository.DeleteAsync(id);

            return Ok(deletedUserBool);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateMatchAsync(Guid id, AddMatchDTO addMatchDTO)
        {
            MatchDTO match = await _matchRepository.GetAsync(id);

            if (match == null)
            {
                return Ok(false);
            }
            match.user1 = addMatchDTO.user1;
            match.user2 = addMatchDTO.user2;
            match.winner = addMatchDTO.winner;
            match.question_id = addMatchDTO.question_id;
            match.winning_soln_code = addMatchDTO.winning_soln_code;
            var updatedUser = await _matchRepository.UpdateAsync(id, _mapper.Map<Match>(match));

            return Ok(updatedUser);
        }

        [HttpPost]
        [Route("/queueUsers")]
        public async Task<IActionResult> QueueUsersTogetherAsync(string userId, int mmr)
        {
            int searchRadius = 0;
            (int, int) min_max = _enqueueService.EnqueuePlayer(userId, mmr); // enqueue the player into redis database
            var min = min_max.Item1;
            var max = min_max.Item2;
            var original = $"elo_queue_{min}_{max}";
            // find user in specific elo bracket, if none found expand out after 10 seconds
            RedisValue? opponent = null;

            // does 10 different brackets
            while (searchRadius < 10)
            {
                // go through all the brackets up to searchRadius, guaranteed to be at least 1
                for (int i = 0; i < searchRadius; i++)
                {

                    var offset = searchRadius * 100;

                    var lowerBucket = original;
                    var upperBucket = $"elo_queue_{min + (offset)}_{max + (offset)}";
                    if (min != 0)
                    {
                        lowerBucket = $"elo_queue_{min - (offset)}_{max - (offset)}";
                    }

                    Console.WriteLine("Searching original...");
                    opponent = await _enqueueService.AttemptMatchPlayer(min, max, userId); // search original bracket


                    if (lowerBucket != original && opponent == null) // actually search the lower bucket if different than original bracket, and match not found
                    {
                        opponent = await _enqueueService.AttemptMatchPlayer(min - offset, max - offset, userId);

                        Console.WriteLine($"Searching lower bucket {min - offset} {max - offset}");
                    }
                    if (opponent == null) // search upper bracket if nothing was found in lower
                    {
                        opponent = await _enqueueService.AttemptMatchPlayer(min + offset, max + offset, userId);
                        Console.WriteLine($"Searching upper bucket {min + offset} {max + offset}");
                    }

                    if (opponent != null) // match was found, stop queueing
                    {
                        AddMatchDTO matchDto = new AddMatchDTO(userId, opponent, null, null, null);
                        await AddMatchAsync(matchDto); // makes a match in DB
                        return Ok(matchDto);
                    }
                    Console.WriteLine($"Found match in search radius {searchRadius}: {opponent != null}");
                }
                searchRadius += 1;
            }


            return Ok(null);

        }
    }   
}
