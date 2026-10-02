using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Security.Claims;

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
