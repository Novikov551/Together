using Microsoft.AspNetCore.Mvc;

namespace Together.Endpoints
{
    [ApiController]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    [Produces("application/json")]
    public abstract class BaseController : ControllerBase
    {
        
    }
}
