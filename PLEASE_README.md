# Hi !

Thanks for reviewing my task, I really appreciate your time.
Also, thanks in advance for your feedback :) 


## Dev notes

### My thoughts:
1. I tried to keep the project simple, install typescript was an idea, but then I prefer to use just plain NodeJs.
2. I did not have experience with `Sequelize` but I tried to use as much I can, I guess that was part of the challenge (not using raw sql).
3. I added a base layer architecture (Router, Controller, Service, etc), I use the same controller and service for all models, just to keep it simple, in a real project probably I will change the design.

### Faced troubles:
1. I had to upgrade the dependencies, something was wrong with some native dependencies.

### Pending work:
1. I really wanted to add some unit and integration testing, however the time is over, and the amount of work is considerable
2. I did not plan to create a React app to interact with endpoints, my plan was to add a Swagger, so you can use the endpoint easier. But there is no time, and I added a postman collection, I hope it helps.
3. Add prettier and linter was a must, actually was hard not to have it.
4. Research more about concurrency with `Sequelize`, I try to use transactions for the nested operations, but probably I can improve on this topic.
5. I added a decent error handled but is not perfect and schema validations are missing, please consider this.

