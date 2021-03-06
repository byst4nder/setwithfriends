import React, { useState, useEffect } from "react";

import generate from "project-name-generator";
import { makeStyles } from "@material-ui/core/styles";
import { Redirect } from "react-router";
import Card from "@material-ui/core/Card";
import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogActions from "@material-ui/core/DialogActions";

import PromptDialog from "../components/PromptDialog";
import firebase from "../firebase";
import { computeState } from "../util";

const useStyles = makeStyles(theme => ({
  container: {
    padding: 40,
    height: "100%",
    textAlign: "center"
  },
  menu: {
    padding: 12,
    display: "flex",
    flexDirection: "column",
    "& button": {
      margin: 12,
      marginTop: 6,
      marginBottom: 6
    },
    "& button:first-child": {
      marginTop: 12,
      marginBottom: 12
    },
    "& button:last-child": {
      marginBottom: 12
    }
  },
  warningBtn: {
    color: theme.palette.warning.contrastText,
    background: theme.palette.warning.main,
    "&:hover": {
      background: theme.palette.warning.dark
    }
  }
}));

function LobbyPage({ user }) {
  const classes = useStyles();
  const [redirect, setRedirect] = useState(null);
  const [play, setPlay] = useState(false);
  const [join, setJoin] = useState(false);
  const [spectate, setSpectate] = useState(false);
  const [options, setOptions] = useState(false);
  const [games, setGames] = useState({});

  useEffect(() => {
    const gameList = user.games ? Object.values(user.games) : [];
    const gamesRef = firebase.database().ref("games/");
    const cleanup = [];
    for (const gameId of gameList) {
      const gameRef = gamesRef.child(gameId);
      const update = snapshot => {
        const game = snapshot.val();
        if (game.meta.status === "done") {
          const { scores } = computeState(game);
          setGames(games => ({
            ...games,
            [gameId]: {
              winner: scores[0][0],
              score: scores.filter(([u, s]) => u === user.id)[0][1]
            }
          }));
        }
      };
      gameRef.on("value", update);
      cleanup.push(() => gameRef.off("value", update));
    }
    return () => {
      for (const func of cleanup) func();
    };
  }, [user]);

  const stats = Object.values(games).reduce(
    ([p, w, s], g) => [p + 1, w + (g.winner === user.id), s + g.score],
    [0, 0, 0]
  );

  if (redirect) return <Redirect push to={redirect} />;

  function playButton() {
    setPlay(true);
  }

  function newRoom() {
    setRedirect("/room/" + generate().dashed);
  }

  function joinRoom() {
    setJoin(true);
  }

  function handleJoin(gameId) {
    setJoin(false);
    if (gameId) {
      setRedirect(`/room/${gameId}`);
    }
  }

  function spectateGame() {
    setSpectate(true);
  }

  function handleSpectate(gameId) {
    setSpectate(false);
    if (gameId) {
      setRedirect(`/game/${gameId}`);
    }
  }

  function optionsButton() {
    setOptions(true);
  }

  function handleReset() {
    setOptions(false);
    firebase.auth().currentUser.delete();
  }

  return (
    <Container className={classes.container}>
      <Dialog open={play} onClose={() => setPlay(false)}>
        <DialogTitle>Play Set</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Welcome! Set with Friends is a web app that lets you play Set in
            real time with others online. To begin, you can either{" "}
            <b>create a new room</b> and share the link with friends, or{" "}
            <b>join an existing game</b> by entering the ID.
          </DialogContentText>
          <DialogActions>
            <Button
              onClick={() => {
                setPlay(false);
                newRoom();
              }}
              variant="contained"
              color="primary"
            >
              New Room
            </Button>
            <Button
              onClick={() => {
                setPlay(false);
                joinRoom();
              }}
              variant="contained"
              color="primary"
            >
              Join Room
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
      <PromptDialog
        open={join}
        onClose={handleJoin}
        title="Join Room"
        message="To join a game with others, please enter the room ID below. Alternatively, you can also enter a direct link to the game in the address bar."
        label="Room ID"
      />
      <PromptDialog
        open={spectate}
        onClose={handleSpectate}
        title="Spectate"
        message="To spectate a game, please enter the room ID below. You will be redirected to the game page, where you can watch the action live."
        label="Room ID"
      />
      <Dialog open={options} onClose={() => setOptions(false)}>
        <DialogTitle>Options</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You can reset your user data (including stats) with the button
            below.
          </DialogContentText>
          <DialogActions>
            <Button className={classes.warningBtn} onClick={handleReset}>
              Reset Data
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
      <Typography variant="h3" component="h2" gutterBottom>
        Set with Friends
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={4}>
          {/* empty */}
        </Grid>
        <Grid item xs={4}>
          <Card elevation={2} className={classes.menu}>
            <Button onClick={playButton} variant="contained" color="primary">
              Play
            </Button>
            <Button onClick={newRoom} variant="contained">
              New Room
            </Button>
            <Button onClick={joinRoom} variant="contained">
              Join Room by ID
            </Button>
            <Button onClick={spectateGame} variant="contained">
              Spectate
            </Button>
            <Button onClick={optionsButton} variant="contained">
              Options
            </Button>
          </Card>
        </Grid>
        <Grid item xs={3}>
          <Card className={classes.menu}>
            <Typography variant="h6" gutterBottom>
              Statistics
            </Typography>
            <Typography variant="body1">Games played: {stats[0]}</Typography>
            <Typography variant="body1">Games won: {stats[1]}</Typography>
            <Typography variant="body1">Total sets: {stats[2]}</Typography>
            <Typography variant="body1">
              Avg. sets per game:{" "}
              {stats[0] ? (stats[2] / stats[0]).toFixed(2) : "N/A"}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={1}>
          {/* empty */}
        </Grid>
      </Grid>
    </Container>
  );
}

export default LobbyPage;
