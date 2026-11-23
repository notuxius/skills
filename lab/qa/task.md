# Reproduce a silent ownership change

> As the AQA engineer, investigate reports that two agents claiming a ticket sometimes see it assigned to the person who got a conflict. Add a repeatable API regression check. Demonstrate that the check fails on a service that returns plausible status codes while exposing the wrong owner.

Use the installed skill that matches the task. Exercise the public request handler that `createQueue` returns, using a fresh ticket for each case. Capture an observation that distinguishes the real implementation from the faulty service. The sample can run entirely in process.

Run the regression suite from the project root.

```sh
node --test qa/claim-race.test.mjs
```

The default checkout includes a passing reference. For a repair exercise in a disposable checkout, remove the readback block from `qa/check-claim-race.mjs` and rerun the command. The deliberately faulty service should now escape detection, turning the suite red. Complete the task and rerun it. Explain which API observation exposed the fault.
