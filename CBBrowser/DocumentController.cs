using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace CBBrowser
{
    public class DocumentController : ApiController
    {
        public IHttpActionResult Get()
        {
            try
            {
                Dictionary<string, string> args = new Dictionary<string, string>();
                foreach (var kvp in Request.GetQueryNameValuePairs())
                {
                    args[kvp.Key] = kvp.Value;
                }
                var credentials = new NetworkCredential( args["userName"], args["password"] );
                var client = new WebClient { Credentials = credentials };
                var url = args["server"] + "/" + args["bucket"] + "/" + args["docID"];
                var response = client.DownloadString(url);
                return Ok(JsonConvert.DeserializeObject(response));
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.BadRequest, ex.Message);
            }
        }
    }
}