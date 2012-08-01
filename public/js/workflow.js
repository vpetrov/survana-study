function Workflow_next()
{
	var w=localStorage['workflow'];
	var workflow=null;

	try
	{
		workflow=JSON.parse(w);
	}
	catch (err)
	{
		console.error("Failed to load workflow: "+err);
	}
	
	if (!workflow || !workflow.length)
	{
		console.error("No workflow definition.")
		return null;
	}

	//get current workflow index		
	var c=localStorage['workflow_current'];
	if (typeof(c)==='undefined' || !c.toString().length)
		c=-1;
	
	//convert to a number
	c=parseInt(c);
	
	//unable to convert? use 0 and print an error
	if (isNaN(c))
	{
		console.error("Invalid current workflow number. Defaulting to 0.")
		c=-1;
	}
	
	c++; // ;)
	
	//if no more items are available, wrap around
	if (typeof(workflow[c])==='undefined')
		c=0;

	var next=workflow[c];
	
	if (typeof(next['url'])==="undefined")
	{
		console.error("Workflow item "+c+" does not specify a URL.");
		return null;
	}

	localStorage['workflow_current']=c;

	$.mobile.changePage(next['url']);
	
	return true;
}
